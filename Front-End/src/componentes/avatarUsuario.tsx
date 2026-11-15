import React, { useEffect, useState } from 'react';

interface AvatarUsuarioProps {
  image?: string | null;
  className: string;
  alt?: string;
}

function AvatarUsuario({
  image,
  className,
  alt = 'Foto de perfil',
}: AvatarUsuarioProps) {
  const [erroImagem, setErroImagem] = useState(false);

  useEffect(() => {
    setErroImagem(false);
  }, [image]);

  if (image && !erroImagem) {
    return (
      <img
        src={image}
        alt={alt}
        className={className}
        onError={() => setErroImagem(true)}
      />
    );
  }

  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Ícone padrão de usuário"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

export default AvatarUsuario;
