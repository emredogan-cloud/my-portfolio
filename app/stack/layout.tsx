import Navbar from "@/components/layout/Navbar";

export default function StackLayout({
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
