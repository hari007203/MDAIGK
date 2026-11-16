import './LoginIllustration.css';

export function LoginIllustration() {
  return (
    <>
      <img
        className="login-illustration__image"
        src="/assets/mango-dude-illustration-transparent.png"
        alt=""
      />
      <span className="login-illustration__path-glow" aria-hidden="true">
        <span />
      </span>
    </>
  );
}
