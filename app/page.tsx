import Image from "next/image";
import logo from "@/images/logo.png";

export default function Home() {
  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo-wrap">
            <Image
              src={logo}
              alt="logo"
              fill
              className="nav-logo"
            />
          </div>
          <h1 className="nav-title">
            SUMMIT
          </h1>
        </div>
        
        <div className="nav-links">
          <button>Sign Up</button>
          <button>Login</button>
        </div>
      </nav>


      <div className="text-group">
        <h1 className="text-group-header">
          This is our basic text group. FORMAT THE CSS IN THE CODE.
        </h1>
        <hr className="text-group-line"/>
        <div className="text-group-body">
          This is the body text.
          Lorem ipsum blah blah blah idk the rest.
          hahahahhahahaahaha
        </div>
      </div>
    </>
  );
}
