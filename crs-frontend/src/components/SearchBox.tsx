import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBoxProps {
    onSearch: (keyword: string) => void;
    placeholder?: string;
}

export default function SearchBox({ onSearch, placeholder }: SearchBoxProps) {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(inputValue.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [inputValue, onSearch]);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: 360, display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, pointerEvents: 'none' }} />
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder ?? 'Tìm kiếm...'}
                style={{
                    width: '100%',
                    paddingLeft: 34,
                }}
            />
        </div>
    );
}