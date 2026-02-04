import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Home = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold">
          <span className="text-blue-400">Meet</span>-<span className="text-red-400">Zone</span>
        </h1>

        <div className="flex gap-3">

          {/* Guest */}
          <Button className="cursor-pointer" variant="secondary" onClick={() => navigate("/dashboard?guest=true")}>
            Join as Guest
          </Button>

          {/* Auth */}
          {token ? (
            <Button className="cursor-pointer"
              variant="destructive"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
            >
              Logout
            </Button>
          ) : (
            <Button className="cursor-pointer" onClick={() => navigate("/signup")}>
              Login
            </Button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="flex flex-col md:flex-row items-center px-10 mt-24">

        <div className="md:w-1/2 space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="text-yellow-500">Connect</span> with your
          </h1>
          <h2 className="text-5xl font-bold">Loved Ones</h2>

          <Button className="mt-4 cursor-pointer" onClick={() => navigate("/signup")}>
            Get Started
          </Button>
        </div>

        <div className="md:w-1/2 flex justify-center mt-10">
          <img src="/mobile.png" className="w-96" />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-32 border-t border-zinc-800 py-6 text-center text-sm text-white font-bold">
        © {new Date().getFullYear()} Meet-Zone
      </footer>

    </div>
  );
};

export default Home;
