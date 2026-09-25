import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export default function UserSearch({ value, onChange, placeholder = "Search by name or phone" }) {
  const [term, setTerm] = useState(value || "");

  useEffect(() => {
    const handle = setTimeout(() => {
      if (term !== value) onChange(term);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  useEffect(() => {
    setTerm(value || "");
  }, [value]);

  return (
    <div className="relative w-full max-w-[340px]">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" />
      <input
        type="text"
        value={term}
        placeholder={placeholder}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Search users"
        className="w-full rounded-[8px] border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-[13.5px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6] focus:border-[#fd7e13]"
      />
    </div>
  );
}