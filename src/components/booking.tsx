"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, X } from "lucide-react";
import { motion } from "motion/react";

import { Turnstile } from "./Turnstile";
import { captureUtm } from "@/lib/contact-tracking";
import { useEntrance, useFeedback } from "@/components/motion/Reveal";

function createContactSchema(t: ReturnType<typeof useTranslations<"contact">>) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.required"))
      .max(120, t("validation.maxLength", { max: 120 })),

    email: z
      .string()
      .trim()
      .min(1, { error: t("validation.required") })
      .pipe(
        z.email({
          error: t("validation.email"),
        }),
      )
      .pipe(
        z.string().max(200, {
          error: t("validation.maxLength", { max: 200 }),
        }),
      ),

    phone: z
      .string()
      .trim()
      .max(50, t("validation.maxLength", { max: 50 })),

    message: z
      .string()
      .trim()
      .min(1, t("validation.required"))
      .max(4000, t("validation.maxLength", { max: 4000 })),

    marketingConsent: z.boolean(),
  });
}

type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>;

const BookingContext = createContext<() => void>(() => {});

export function ConsultationLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const open = useContext(BookingContext);
  const isCard = className === "service-card";
  const feedback = useFeedback(isCard ? 3 : 1);
  const entrance = useEntrance();

  return (
    <motion.a
      {...feedback}
      variants={isCard ? entrance : undefined}
      href="#booking"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        open();
      }}
    >
      {children}
    </motion.a>
  );
}

export function ConsultationButton({
  className = "button button-primary",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("contact");
  const open = useContext(BookingContext);
  const feedback = useFeedback();

  return (
    <motion.button type="button" {...feedback} className={className} onClick={open}>
      {children || t("cta")}
      <ArrowUpRight size={17} />
    </motion.button>
  );
}

function ContactFields({
  register,
  errors,
}: {
  register: UseFormRegister<ContactFormData>;
  errors: FieldErrors<ContactFormData>;
}) {
  const t = useTranslations("contact");
  const id = useId();

  return (
    <>
      <label>
        {t("name")}
        <input
          {...register("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          autoComplete="name"
          required
          maxLength={120}
        />

        {errors.name?.message && (
          <span id={`${id}-name-error`} role="alert" className="form-status">
            {errors.name.message}
          </span>
        )}
      </label>

      <label>
        {t("emailLabel")}
        <input
          {...register("email")}
          type="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
          autoComplete="email"
          required
          maxLength={200}
        />

        {errors.email?.message && (
          <span id={`${id}-email-error`} role="alert" className="form-status">
            {errors.email.message}
          </span>
        )}
      </label>

      <label>
        {t("phone")}
        <input
          {...register("phone")}
          type="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
          autoComplete="tel"
          maxLength={50}
        />

        {errors.phone?.message && (
          <span id={`${id}-phone-error`} role="alert" className="form-status">
            {errors.phone.message}
          </span>
        )}
      </label>

      <label>
        {t("message")}
        <textarea
          {...register("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          rows={3}
          required
          maxLength={4000}
        />

        {errors.message?.message && (
          <span id={`${id}-message-error`} role="alert" className="form-status">
            {errors.message.message}
          </span>
        )}
      </label>
    </>
  );
}

function EmailForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("contact");
  const locale = useLocale();

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const [token, setToken] = useState("");
  const [generation, setGeneration] = useState(0);

  const contactSchema = createContactSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      marketingConsent: false,
    },
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const configured = Boolean(apiBase && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const verificationError = useCallback(() => {
    setToken("");
  }, []);

  async function onSubmit(data: ContactFormData) {
    if (!configured || !token) {
      return;
    }

    setStatus("idle");

    try {
      const response = await fetch(`${apiBase!.replace(/\/$/, "")}/contact`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          ...captureUtm(),
          locale,
          turnstileToken: token,
        }),
        signal: AbortSignal.timeout(35_000),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error("Submission failed");
      }

      setStatus("success");
      onSuccess();
    } catch {
      setStatus("error");
      setToken("");
      setGeneration((value) => value + 1);
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form">
        <p id="booking-sent" role="status" className="form-status">
          {t("sent")}
        </p>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <form noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(onSubmit)}>
        <ContactFields register={register} errors={errors} />

        <label className="contact-consent">
          <input {...register("marketingConsent")} type="checkbox" />
          {t("marketingConsent")}
        </label>

        {configured && (
          <Turnstile onToken={setToken} onError={verificationError} generation={generation} locale={locale} />
        )}

        <button className="button button-primary" type="submit" disabled={!configured || !token || isSubmitting}>
          {t(isSubmitting ? "submitting" : "submit")}
          <ArrowUpRight size={17} />
        </button>

        {(!configured || status === "error") && (
          <p role="alert" className="form-status">
            {t(configured ? "error" : "unavailable")}
          </p>
        )}
      </form>

      <a className="text-link" href={`mailto:${t("email")}`}>
        {t("email")}
      </a>
    </div>
  );
}

export function BookingExperience({ children }: { children: React.ReactNode }) {
  const contact = useTranslations("contact");
  const dialog = useRef<HTMLDialogElement>(null);

  const [opening, setOpening] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const previousOverflow = useRef("");
  const bodyScrollLocked = useRef(false);

  function open() {
    if (dialog.current?.open) {
      return;
    }

    previousOverflow.current = document.body.style.overflow;

    bodyScrollLocked.current = true;

    setSubmitted(false);
    setOpening((value) => value + 1);

    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
  }

  function restoreBodyScroll() {
    if (!bodyScrollLocked.current) {
      return;
    }

    document.body.style.overflow = previousOverflow.current;

    bodyScrollLocked.current = false;
  }

  useEffect(() => {
    captureUtm();

    return () => {
      restoreBodyScroll();
    };
  }, []);

  return (
    <BookingContext.Provider value={open}>
      {children}

      <dialog
        id="booking"
        ref={dialog}
        className="consult-dialog"
        aria-labelledby={submitted ? "booking-sent" : "booking-title"}
        aria-describedby={submitted ? undefined : "booking-description"}
        onClose={restoreBodyScroll}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialog.current?.close();
          }
        }}
      >
        <div className="dialog-inner">
          <button
            type="button"
            className="dialog-close"
            onClick={() => dialog.current?.close()}
            aria-label={contact("close")}
          >
            <X />
          </button>

          {!submitted && (
            <>
              <span className="eyebrow">{contact("eyebrow")}</span>
              <h2 id="booking-title">{contact("dialogTitle")}</h2>
              <p id="booking-description">{contact("dialogDescription")}</p>
            </>
          )}

          {opening > 0 && <EmailForm key={opening} onSuccess={() => setSubmitted(true)} />}
        </div>
      </dialog>
    </BookingContext.Provider>
  );
}
