import { useState, useEffect, useRef } from "react";
import { MoreVertical, Edit2, Copy, FolderInput, Trash2 } from "lucide-react";

const WorkspaceContextMenu = ({ onRename, onDuplicate, onMove, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          <div className="flex flex-col space-y-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onRename?.(); }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Edit2 size={16} className="text-gray-400" /> Rename
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDuplicate?.(); }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Copy size={16} className="text-gray-400" /> Duplicate
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onMove?.(); }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FolderInput size={16} className="text-gray-400" /> Move to
            </button>
            
            <div className="my-1 border-t border-gray-100" />
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete?.(); }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} className="text-red-500" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceContextMenu;