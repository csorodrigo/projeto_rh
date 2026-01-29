import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to public career portal instead of protected dashboard
  redirect("/vagas")
}
