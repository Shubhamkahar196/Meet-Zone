import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Home = () => {
  const navigate = useNavigate(); 

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <img
        src="./background.png"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      <main className="container mx-auto px-6">
        {/* Navbar */}
        <nav className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-blue-400">Meet</span>
             
             <b>-</b>
            <span className="text-red-400">Zone</span>
          </h1>

          <div className="space-x-4">
            <button className="border px-4 py-2 rounded text-white font-bold cursor-pointer">
              Join as Guest
            </button>
            {/* <button >
              Login
            </button> */}
            <Button className="bg-yellow-500 text-white font-bold cursor-pointer" onClick={() => navigate("/signup")}>Login</Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center mt-16">
          {/* Left */}
          <div className="md:w-1/2 space-y-4">
            <h1 className="text-5xl font-bold text-white">
              <span className="text-yellow-500">Connect</span> with your
            </h1>
            <h2 className="text-5xl font-bold text-white">Loved Ones</h2>
            <p className="text-white font-bold">
              Cover a distance by meet-zone
            </p>

            <button onClick={()=> navigate("/signup")} className="bg-blue-500 text-white font-bold px-6 py-3 rounded cursor-pointer">
              Get Started
            </button>
          </div>

          {/* Right */}
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
            <img
              src="./mobile.png"
              alt="mobile"
              className="max-w-full md:w-3/4"
            />
          </div>
        </section>
      </main>

      {/* Footer */}
<footer className="mt-20 border-t border-white/20 py-8">
  <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-white">

 
    <h2 className="text-xl font-bold mb-4 md:mb-0">
      <span className="text-blue-400">Meet</span>-
      <span className="text-red-400">Zone</span>
    </h2>

   

    {/* Copyright */}
    <p className="text-sm text-white/70">
      © {new Date().getFullYear()} Meet-Zone. All rights reserved.
    </p>
  </div>
</footer>

    </div>
    
  );
};

export default Home;
