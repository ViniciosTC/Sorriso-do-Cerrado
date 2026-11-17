import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './adicionarProduto.module.css';

const CATEGORIAS = [
  'Moda e acessórios',
  'Joias e bijuterias',
  'Crochê e peças artesanais',
  'Decoração',
  'Organização e armazenamento',
  'Mesa e cozinha',
  'Aromas e cuidados pessoais',
  'Jardim e plantas',
  'Presentes e lembranças',
];

function AdicionarProduto() {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [imagemURL, setImagemURL] = useState('');
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [arrastando, setArrastando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');

  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { mostrarNotificacao } = useNotificacao();

  useEffect(() => {
    if (!arquivoImagem) {
      setPreviewUrl('');
      return;
    }

    const urlTemporaria = URL.createObjectURL(arquivoImagem);
    setPreviewUrl(urlTemporaria);

    return () => {
      URL.revokeObjectURL(urlTemporaria);
    };
  }, [arquivoImagem]);

  const selecionarArquivo = (arquivo: File | null) => {
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      mostrarNotificacao('Selecione um arquivo de imagem válido.', 'erro');
      return;
    }

    setArquivoImagem(arquivo);
    setError('');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastando(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastando(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastando(false);
    const arquivo = event.dataTransfer.files?.[0] ?? null;
    selecionarArquivo(arquivo);
  };

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

    setSalvando(true);
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
      navigate('/admin', { state: { aba: 'produtos' } });
    } catch (err: unknown) {
      const mensagem = axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;

      setError(mensagem || 'Erro ao adicionar produto');
    } finally {
      setSalvando(false);
    }
  };

  const imagemParaExibir = previewUrl || imagemURL;

  return (
    <div className={styles.pagina}>
      <BarraNavegacao />

      <main className={styles.conteudo}>
        <div className={styles.formularioContainer}>
          <header className={styles.cabecalho}>
            <div>
              <p className={styles.sobretitulo}>Sua loja</p>
              <h2>Adicionar Novo Produto</h2>
              <p className={styles.subtitulo}>
                Preencha as informações do item para exibi-lo no catálogo.
              </p>
            </div>

            <Link
              to="/admin"
              state={{ aba: 'produtos' }}
              className={styles.botaoVoltar}
            >
              Voltar
            </Link>
          </header>

          <form onSubmit={handleSubmit} className={styles.formulario}>
            <div className={styles.duasColunas}>
              <div className={styles.campoFormulario}>
                <label htmlFor="nomeProduto">Nome do Produto *</label>
                <input
                  id="nomeProduto"
                  type="text"
                  placeholder="Ex: Vaso de cerâmica artesanal"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className={styles.campoFormulario}>
                <label htmlFor="categoria">Categoria *</label>
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
            </div>

            <div className={styles.campoFormulario}>
              <label htmlFor="descricaoProduto">Descrição</label>
              <textarea
                id="descricaoProduto"
                placeholder="Descreva os materiais, dimensões e detalhes da peça..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.duasColunas}>
              <div className={styles.campoFormulario}>
                <label htmlFor="precoProduto">Preço (R$) *</label>
                <input
                  id="precoProduto"
                  type="number"
                  placeholder="0,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                  step="0.01"
                  min="0.1"
                />
              </div>

              <div className={styles.campoFormulario}>
                <label htmlFor="estoqueProduto">Estoque *</label>
                <input
                  id="estoqueProduto"
                  type="number"
                  placeholder="Quantidade disponível"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className={styles.campoFormulario}>
              <label>Imagem do Produto</label>
              <div
                role="button"
                tabIndex={0}
                className={`${styles.zonaUpload} ${
                  arrastando ? styles.zonaUploadAtiva : ''
                }`}
                onClick={() => inputArquivoRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    inputArquivoRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept="image/*"
                  className={styles.inputArquivoOculto}
                  onChange={(e) => {
                    selecionarArquivo(e.target.files?.[0] ?? null);
                    e.target.value = '';
                  }}
                />

                {imagemParaExibir ? (
                  <div className={styles.previewContainer}>
                    <img
                      src={imagemParaExibir}
                      alt="Pré-visualização do produto"
                      className={styles.previewImagem}
                    />
                    <div className={styles.previewInfo}>
                      <span className={styles.nomeArquivo}>
                        {arquivoImagem
                          ? arquivoImagem.name
                          : 'Imagem carregada por URL'}
                      </span>
                      <span className={styles.dicaTroca}>
                        Arraste outra imagem ou clique para substituir
                      </span>
                      {arquivoImagem && (
                        <button
                          type="button"
                          className={styles.botaoRemoverArquivo}
                          onClick={(e) => {
                            e.stopPropagation();
                            setArquivoImagem(null);
                          }}
                        >
                          Remover imagem
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.conteudoUpload}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.iconeUpload}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className={styles.textoPrincipalUpload}>
                      <strong>Arraste a foto aqui</strong> ou clique para
                      selecionar do computador
                    </p>
                    <span className={styles.textoSecundarioUpload}>
                      PNG, JPG ou WEBP
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.divisorOu}>
              <span>ou informe o link da imagem</span>
            </div>

            <div className={styles.campoFormulario}>
              <label htmlFor="urlImagem">URL da imagem</label>
              <input
                id="urlImagem"
                type="text"
                placeholder="https://exemplo.com/foto-do-produto.jpg"
                value={imagemURL}
                onChange={(e) => setImagemURL(e.target.value)}
              />
            </div>

            {error && <p className={styles.mensagemErro}>{error}</p>}

            <button
              type="submit"
              className={styles.botaoSubmit}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </form>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default AdicionarProduto;
