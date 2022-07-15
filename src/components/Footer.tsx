import appDescription from "../../package.json";

function Footer() {
  return (
    <footer className="footer py-3 bg-light">
        <span className="text-muted">{appDescription.description} - v{appDescription.version}</span>
    </footer>
  )
}

export default Footer;