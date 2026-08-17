// The signature "star rule" — a Ghana flag tricolour hairline led by a star.
// The single memorable brand gesture; used under section eyebrows app-wide.
export default function StarRule({ className = "" }) {
  return (
    <span aria-hidden="true" className={`star-rule ${className}`}>
      <span className="star-rule__star">★</span>
      <span className="star-rule__bar">
        <span className="star-rule__red" />
        <span className="star-rule__gold" />
        <span className="star-rule__green" />
      </span>
    </span>
  );
}
