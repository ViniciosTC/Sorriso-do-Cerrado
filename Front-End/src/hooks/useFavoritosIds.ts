import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/authContext';

export function useFavoritosIds() {
  const { isAuthenticated } = useAuth();
  const [favoritosIds, setFavoritosIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoritosIds([]);
      return;
    }

    let ativo = true;

    axios
      .get<{ id: number }[]>('http://localhost:3000/favoritos', {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (ativo) setFavoritosIds(data.map((favorito) => favorito.id));
      })
      .catch((error) => console.error('Erro ao buscar favoritos:', error));

    return () => {
      ativo = false;
    };
  }, [isAuthenticated]);

  return favoritosIds;
}
