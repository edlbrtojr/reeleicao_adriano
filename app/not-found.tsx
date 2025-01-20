"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const NotFoundPage = () => {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className={`text-center mt-12 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            <h1 className="text-6xl font-bold">404</h1>
            <h2 className="text-2xl mt-4">Oops! Página não encontrada.</h2>
            <p className="mt-2">Estou construindo essa página, paga nois!</p>
            <img 
                src="https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif" 
                alt="Trabalhando nisso" 
                className="w-72 mt-5 mx-auto"
            />
            <div className="mt-5">
                <Link href="/">
                   Voltar para a página inicial
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;