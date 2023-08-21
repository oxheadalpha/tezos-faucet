import { Nav, Navbar, Container } from "react-bootstrap"
import { Github } from "react-bootstrap-icons"
import Config from "../Config"

function Header() {
  return (
    <Navbar bg="light" expand="lg">
      <Container fluid>
        <Nav>
          <Navbar.Brand>
            <a href="https://www.oxheadalpha.com" target="_blank">
              <img
                src="/public/oxheadalpha.svg"
                className="d-inline-block align-top"
                width="30"
                height="30"
                alt="Oxhead Alpha Logo"
              />
            </a>{" "}
            {Config.application.name}
          </Navbar.Brand>
        </Nav>
        <Nav>
          <Nav.Link href={Config.application.githubRepo} target="_blank">
            <Github />
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  )
}

export default Header
