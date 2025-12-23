import { Link } from "react-router-dom";
import logo from "@/assets/logo_quizme.png";

const QuizmeLogo = ({ className = "h-10" }: { className?: string }) => (
  <Link to="/" className="flex items-center gap-3">
    <img src={logo} alt="QuizMe" className={className} />
    <span className="text-2xl font-bold text-primary select-none">QUIZME</span>
  </Link>
);

export default QuizmeLogo;
