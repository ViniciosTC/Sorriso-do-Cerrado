import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './adicionarProduto.module.css';

const CATEGORIAS = [
  'Cerâmica',
  'Decoração',
  'Acessórios',
  'Tecelagem',
  'Arte em madeira',
  'Pintura',
  'Outros',
];

function AdicionarProduto() {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [imagemURL, setImagemURL] = useState('');
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { mostrarNotificacao } = useNotificacao();

  const handleUploadImagem = async () => {
    try {
      if (!arquivoImagem) return imagemURL;

      const formData = new FormData();
      formData.append('imagem', arquivoImagem);

      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      return res.data.url;
    } catch (err: unknown) {
      console.error('Erro no upload:', err);
      throw new Error('Falha no upload da imagem');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const precoFormatado = parseFloat(preco);

    if (isNaN(precoFormatado) || precoFormatado <= 0) {
      setError(
        'O preço do produto deve ser um valor numérico maior que zero.'
      );
      return;
    }

    try {
      const urlFinal = await handleUploadImagem();

      const novoProduto = {
        nome,
        categoria: categoria || null,
        descricao,
        preco: precoFormatado,
        estoque: parseInt(estoque, 10),
        imagemURL: urlFinal,
      };

      await axios.post('http://localhost:3000/produtos', novoProduto, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      mostrarNotificacao('Produto adicionado com sucesso!', 'sucesso');
      navigate('/admin');
    } catch (err: unknown) {
      const mensagem = axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;

      setError(mensagem || 'Erro ao adicionar produto');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BarraNavegacao />

      <main className="conteudo-geral" style={{ padding: '2rem', flex: 1 }}>
        <div className={styles.formularioContainer}>
          <form onSubmit={handleSubmit}>
            <h2>Adicionar Novo Produto</h2>

            <div className={styles.campoFormulario}>
              <label>Nome do Produto</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className={styles.campoFormulario}>
              <label htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.campoFormulario}>
              <label>Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.campoFormulario}>
              <label>Preço</label>
              <input
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
                step="0.01"
                min="0.1"
              />
            </div>

            <div className={styles.campoFormulario}>
              <label>Estoque</label>
              <input
                type="number"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
                required
              />
            </div>

            <div className={styles.campoFormulario}>
              <label>Upload de imagem</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setArquivoImagem(e.target.files?.[0] ?? null)
                }
              />
            </div>

            <p style={{ textAlign: 'center' }}>ou</p>

            <div className={styles.campoFormulario}>
              <label>URL da imagem</label>
              <input
                type="text"
                value={imagemURL}
                onChange={(e) => setImagemURL(e.target.value)}
              />
            </div>

            {error && <p className={styles.mensagemErro}>{error}</p>}

            <button type="submit" className={styles.botaoSubmit}>
              Salvar Produto
            </button>
          </form>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default AdicionarProduto;