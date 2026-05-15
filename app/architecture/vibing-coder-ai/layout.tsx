import Navbar from "@/components/layout/Navbar";

export default function VCAIArchitectureLayout({
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
