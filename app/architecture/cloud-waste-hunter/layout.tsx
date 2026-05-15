import Navbar from "@/components/layout/Navbar";

export default function CWHArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
