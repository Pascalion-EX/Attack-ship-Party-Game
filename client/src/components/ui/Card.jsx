const Card = ({
  children,
  className = "",
  padding = true,
}) => {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900 ${
        padding ? "p-5 sm:p-6" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
};

export default Card;