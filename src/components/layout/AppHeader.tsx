import logo from "@/assets/whirlpool-logo.png";

export const AppHeader = () => (
  <header className="flex items-center justify-center py-5 bg-background">
    <img src={logo} alt="Whirlpool" className="h-9 w-auto" />
  </header>
);
