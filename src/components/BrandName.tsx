export function BrandName({ name }: { name: string }) {
  return (
    <span className="brand-name">
      {name.split(/(ai)/i).map((part, index) =>
        /^(ai)$/i.test(part) ? (
          <span className="brand-ai" key={index}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
