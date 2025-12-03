import Image from "next/image";

export default function Home() {
  return (
    <>
      <nav>
        <button>Test: THIS IS THE BUTTON. CHANGE THE REGULAR, HOVER, AND CLICK CSS.</button>
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
