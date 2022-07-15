import { Nav, Navbar, Container } from 'react-bootstrap';
import { Github, Twitter } from 'react-bootstrap-icons';
import Config from "../Config";

function Header() {
    return (
        <Navbar bg="light" expand="lg">
            <Container fluid>
                <Nav>
                    <Navbar.Brand>
                        {Config.application.name}
                    </Navbar.Brand>
                </Nav>
                <Nav>

                    <Nav.Link href={Config.application.githubRepo} target="_blank">
                        <Github />
                    </Nav.Link>

                    <Nav.Link href="#" target="_blank">
                        <Twitter />
                    </Nav.Link>

                </Nav>

            </Container>
        </Navbar>
    )
}

export default Header;
