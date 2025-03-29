import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showPoweredBy?: boolean;
}

export function Logo({ className = '', showPoweredBy = false }: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Link to="/" className="text-2xl font-bold">
        <span className="text-blue-500">Form</span>
        <span className="text-gray-800">Filler</span>
      </Link>
      {showPoweredBy && (

        <Link className="mt-2 text-sm text-gray-500 hover:text-blue-500 cursor-pointer" to="/templates">

          Want to build your own form ?

        </Link>

      )}

    </div>
  );
} 