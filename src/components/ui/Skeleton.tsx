import "./Skeleton.css";

export function Skeleton({
  rows = 5,
  message = "Carregando conteúdo",
}: {
  rows?: number;
  message?: string;
}) {
  return (
    <div className="doka-skeleton" role="status" aria-label={message}>
      <span className="sr-only">{message}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="doka-skeleton__row" key={index}>
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
