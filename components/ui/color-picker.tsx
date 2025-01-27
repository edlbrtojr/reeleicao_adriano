import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 shadow-sm"
                    style={{ 
                        backgroundColor: color,
                        boxShadow: `0 0 4px ${color}40`
                    }}
                    aria-label="Choose color"
                />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-white rounded-lg shadow-lg">
                <HexColorPicker 
                    color={color} 
                    onChange={onChange}
                    style={{ width: '200px', height: '200px' }}
                />
            </PopoverContent>
        </Popover>
    );
};
