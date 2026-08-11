import PosShell from "./PosShell";

export const metadata = {
  title: "POS | EazWorld Repair",
  description: "Repair shop point of sale system.",
};

export default function PosLayout({ children }) {
  return <PosShell>{children}</PosShell>;
}
