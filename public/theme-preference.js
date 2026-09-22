(() => {
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem("theme");
  } catch {}

  const theme =
    savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : colorScheme.matches
        ? "dark"
        : "light";

  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.style.backgroundColor =
    theme === "dark" ? "#191a17" : "#fcfaf7";
})();
