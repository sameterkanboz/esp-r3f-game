const Header = () => {
  return (
    <nav className="flex justify-between items-center h-16 bg-white text-black relative shadow-sm font-mono">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold ml-4">Dino Run</h1>
      </div>
      <div className="flex items-center">
        <a href="" className="mr-4">
          Play
        </a>

        <a href="">About</a>
      </div>
    </nav>
  );
};

export default Header;
