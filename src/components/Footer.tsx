const { APP_DESCRIPTION, APP_VERSION } = import.meta.env

function Footer() {
  return (
    <footer className="footer py-3 bg-light">
      <span className="text-muted">
        {APP_DESCRIPTION} - v{APP_VERSION}
      </span>
    </footer>
  )
}

export default Footer
