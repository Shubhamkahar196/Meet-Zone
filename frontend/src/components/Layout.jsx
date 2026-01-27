const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      <img
        src="/background.png"
        alt="background"
        className="fixed inset-0 w-full h-full object-cover -z-10"
      />

      {children}
    </div>
  );
};

export default Layout;
