import React, { useEffect, useState } from 'react';
import { imagens } from '../imagens';

interface ImagemProdutoProps {
  src?: string | null;
  alt: string;
  className: string;
}

function ImagemProduto({ src, alt, className }: ImagemProdutoProps) {
  const [erroImagem, setErroImagem] = useState(false);
  const usarImagemAlternativa = erroImagem || !src;

  useEffect(() => {
    setErroImagem(false);
  }, [src]);

  return (
    <img
      src={usarImagemAlternativa ? imagens.principal : src}
      alt={usarImagemAlternativa ? 'Imagem ilustrativa de artesanato' : alt}
      className={className}
      onError={() => setErroImagem(true)}
    />
  );
}

export default ImagemProduto;
