import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">© 2026 Psich.ai. All rights reserved.</div>
      <div className="footer-right">
        <a href="/help">Help Center</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms</a>
      </div>
    </footer>
  );
}