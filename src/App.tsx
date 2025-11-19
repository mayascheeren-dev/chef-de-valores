import React, { useState, useEffect } from 'react';
import { Calculator, Settings, Plus, Trash2, Package, Clock, ChefHat, Sparkles, Share2, Lightbulb, Type, TrendingUp, Lock, Save, List } from 'lucide-react';

// --- CONFIGURAÇÃO DE SEGURANÇA ---
const ACCESS_PASSWORD = "DOCE2025"; 

// Dados iniciais baseados na planilha
const initialIngredients = [
  { id: 1, name: 'Leite Condensado', packageWeight: 395, cost: 5.50 },
  { id: 2, name: 'Creme de Leite', packageWeight: 200, cost: 3.20 },
  { id: 3, name: 'Chocolate em Pó 50%', packageWeight: 1000, cost: 35.00 },
  { id: 4, name: 'Manteiga', packageWeight: 200, cost: 12.00 },
  { id: 5, name: 'Farinha de Trigo', packageWeight: 1000, cost: 5.00 },
  { id: 6, name: 'Ovos (unidade)', packageWeight: 1, cost: 0.80 },
  { id: 7, name: 'Embalagem Unitária', packageWeight: 1, cost: 1.50 },
];

// Receita inicial padrão
const defaultRecipe = {
  name: 'Brigadeiro Gourmet (Padrão)',
  yields: 20,
  timeSpentMinutes: 60,
  profitMargin: 30,
  selectedIngredients: [
    { id: 1, quantity: 395 },
    { id: 2, quantity: 100 },
    { id: 3, quantity: 40 },
    { id: 4, quantity: 20 },
  ]
};

const App = () => {
  // Estado de Login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('calculator');
  
  // Estado do Negócio (Configurações)
  const [businessConfig, setBusinessConfig] = useState(() => {
    // Usamos um nome de chave neutro para garantir que a persistência funcione
    const savedConfig = localStorage.getItem('chefdevalor_config');
    return savedConfig ? JSON.parse(savedConfig) : { salary: 3000, fixedCosts: 800, hoursPerDay: 8, daysPerWeek: 5 };
  });

  // Estado dos Ingredientes (DB)
  const [ingredients, setIngredients] = useState(() => {
    const savedIngredients = localStorage.getItem('chefdevalor_ingredients');
    return savedIngredients ? JSON.parse(savedIngredients) : initialIngredients;
  });

  // Estado das Receitas Salvas
  const [savedRecipes, setSavedRecipes] = useState(() => {
    const saved = localStorage.getItem('chefdevalor_saved_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado da Receita Atual
  const [recipe, setRecipe] = useState(defaultRecipe);

  // Efeitos de persistência
  useEffect(() => {
    localStorage.setItem('chefdevalor_config', JSON.stringify(businessConfig));
  }, [businessConfig]);

  useEffect(() => {
    localStorage.setItem('chefdevalor_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('chefdevalor_saved_recipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);


  // Verificar se já estava logado (salvo no navegador)
  useEffect(() => {
    // Usamos a chave antiga 'doceLucroAuth' por compatibilidade em navegadores que já a salvaram
    const savedAuth = localStorage.getItem('doceLucroAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Função de Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPassword === ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('doceLucroAuth', 'true'); // Lembrar login
      setLoginError('');
    } else {
      setLoginError('Senha incorreta. Verifique seu acesso.');
    }
  };

  // Função de Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('doceLucroAuth');
  };

  // --- HANDLERS DE RECEITAS SALVAS ---
  const handleSaveRecipe = () => {
    if (!recipe.name) {
      alert("Por favor, nomeie a receita antes de salvar!");
      return;
    }
    const recipeToSave = {
      ...recipe,
      id: Date.now(),
      savedAt: new Date().toLocaleString('pt-BR'),
      hourlyRate: hourlyRate.toFixed(2), // Salva a taxa horária para contexto
    };
    setSavedRecipes([...savedRecipes, recipeToSave]);
    alert(`Receita "${recipe.name}" salva com sucesso!`);
    setActiveTab('savedRecipes');
  };

  const handleLoadRecipe = (recipeId) => {
    const recipeToLoad = savedRecipes.find(r => r.id === recipeId);
    if (recipeToLoad) {
      setRecipe({
        ...recipeToLoad,
        profitMargin: recipeToLoad.profitMargin || 30, // Garante valor padrão se faltar
      });
      alert(`Receita "${recipeToLoad.name}" carregada!`);
      setActiveTab('calculator');
    }
  };

  const handleDeleteRecipe = (recipeId, recipeName) => {
    if (window.confirm(`Tem certeza que deseja deletar a receita: "${recipeName}"?`)) {
      setSavedRecipes(savedRecipes.filter(r => r.id !== recipeId));
    }
  };
  
  // --- CÁLCULOS MATEMÁTICOS ---
  const calculateHourlyRate = () => {
    const weeksPerMonth = 4.28;
    const totalHoursMonth = businessConfig.hoursPerDay * businessConfig.daysPerWeek * weeksPerMonth;
    const totalCost = parseFloat(businessConfig.salary) + parseFloat(businessConfig.fixedCosts);
    return totalHoursMonth > 0 ? totalCost / totalHoursMonth : 0;
  };

  const hourlyRate = calculateHourlyRate();

  const calculateRecipeCosts = () => {
    let totalIngredientsCost = 0;
    recipe.selectedIngredients.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.id);
      if (ingredient) {
        const costPerGram = ingredient.cost / ingredient.packageWeight;
        totalIngredientsCost += costPerGram * item.quantity;
      }
    });

    const variableCosts = totalIngredientsCost * 0.10;
    const laborCost = (recipe.timeSpentMinutes / 60) * hourlyRate;
    const totalProductionCost = totalIngredientsCost + variableCosts + laborCost;
    const profitValue = totalProductionCost * (recipe.profitMargin / 100);
    const totalSalePrice = totalProductionCost + profitValue;
    const pricePerUnit = recipe.yields > 0 ? totalSalePrice / recipe.yields : 0;

    return {
      totalIngredientsCost,
      variableCosts,
      laborCost,
      totalProductionCost,
      profitValue,
      totalSalePrice,
      pricePerUnit
    };
  };

  const results = calculateRecipeCosts();

  // --- INTEGRAÇÃO COM GEMINI API ---
  const callGemini = async (promptType) => {
    setIsAiLoading(true);
    setAiError(null);
    setAiResult('');

    const apiKey = ""; // Chave injetada pelo ambiente
    const model = "gemini-2.5-flash-preview-09-2025";
    
    // Puxa a chave da variável de ambiente VITE_GEMINI_API_KEY
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || apiKey;
    
    const ingredientsList = recipe.selectedIngredients
      .map(item => ingredients.find(i => i.id === item.id)?.name)
      .join(', ');
    
    const price = formatMoney(results.pricePerUnit);

    let systemInstruction = "Você é um assistente especialista em marketing para confeitaria artesanal. Use tom doce, acolhedor e muitos emojis. Responda em Português do Brasil.";
    let userPrompt = "";

    if (promptType === 'caption') {
      userPrompt = `Crie uma legenda curta e irresistível para Instagram vendendo "${recipe.name}". 
      Ingredientes: ${ingredientsList}. 
      Preço: ${price}. 
      Foque no sabor e na exclusividade.`;
    } else if (promptType === 'sales') {
      userPrompt = `Me dê 3 ideias criativas e rápidas para vender mais "${recipe.name}" ainda hoje.`;
    } else if (promptType === 'names') {
      userPrompt = `O nome atual é "${recipe.name}". Crie 5 nomes 'Gourmet' e sofisticados para valorizar esse doce.`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${envApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] } 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro na conexão com a IA');
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        setAiResult(text);
      } else {
        throw new Error('Nenhuma resposta gerada.');
      }

    } catch (error) {
      setAiError("Ops! A confeiteira virtual está ocupada. Tente de novo em alguns segundos! 🧁");
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- FUNÇÕES DE UTILIDADE ---
  const formatMoney = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  // --- RENDERIZAÇÃO ---

  // TELA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center px-4 font-['Nunito']">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Pacifico&display=swap');
          .font-pacifico { font-family: 'Pacifico', cursive; }
          .font-nunito { font-family: 'Nunito', sans-serif; }
        `}</style>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-[#FFE0B2] text-center">
          <div className="inline-flex items-center justify-center p-4 bg-[#FFF3E0] rounded-full mb-6">
            <ChefHat size={40} className="text-[#E65100]" />
          </div>
          <h1 className="text-4xl font-pacifico text-[#BF360C] mb-2">Chef de Valor</h1>
          <p className="text-[#8D6E63] mb-8">O ingrediente secreto do seu sucesso financeiro!</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Digite sua senha de acesso"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-[#FFE0B2] bg-[#FFF8E1] text-[#5D4037] placeholder-[#D7CCC8] focus:border-[#E65100] focus:outline-none font-bold text-center text-lg"
              />
            </div>
            
            {loginError && (
              <p className="text-red-500 text-sm font-bold animate-pulse">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#E65100] to-[#BF360C] text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Lock size={20} /> Entrar no Sistema
            </button>
          </form>
          
          <p className="mt-8 text-xs text-[#D7CCC8]">
            Não tem acesso? Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // APP PRINCIPAL (SÓ RENDERIZA SE ESTIVER LOGADO)
  return (
    <div className="min-h-screen bg-[#FFF8E7] font-['Nunito'] text-[#5D4037] pb-20">
      {/* Inject Fonts and Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Pacifico&display=swap');
        
        .font-pacifico { font-family: 'Pacifico', cursive; }
        .font-nunito { font-family: 'Nunito', sans-serif; }
        
        .candy-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          box-shadow: 0 10px 30px -10px rgba(139, 69, 19, 0.15);
          border: 1px solid #FFE0B2;
        }

        .candy-input {
          background: #FFF;
          border: 2px solid #FFE0B2;
          border-radius: 16px;
          transition: all 0.3s ease;
          color: #5D4037;
        }
        .candy-input:focus {
          border-color: #E65100;
          box-shadow: 0 0 0 4px rgba(230, 81, 0, 0.1);
          outline: none;
        }
        
        .candy-input::placeholder {
          color: #D7CCC8;
        }

        .btn-primary {
          background: linear-gradient(135deg, #E65100 0%, #BF360C 100%);
          box-shadow: 0 4px 15px rgba(191, 54, 12, 0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(191, 54, 12, 0.4);
        }
      `}</style>

      {/* Hero Header */}
      <header className="relative bg-[#FFF3E0] pt-10 pb-16 overflow-hidden border-b border-[#FFE0B2]">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-[#FFCC80] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#FFAB91] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="flex justify-end mb-4">
            <button onClick={handleLogout} className="text-xs font-bold text-[#E65100] flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
              Sair <Lock size={10} />
            </button>
          </div>
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg mb-4 border border-[#FFE0B2]">
            <span className="text-3xl">🧁</span>
          </div>
          <h1 className="font-pacifico text-5xl text-[#BF360C] mb-2 drop-shadow-sm">Chef de Valor</h1>
          <p className="text-[#8D6E63] font-nunito text-lg max-w-xl mx-auto font-semibold">
            O ingrediente secreto do seu sucesso financeiro!
          </p>
        </div>
      </header>

      {/* Floating Navigation */}
      <div className="sticky top-4 z-50 max-w-4xl mx-auto px-4 mb-8">
        <nav className="bg-white/90 backdrop-blur-md rounded-full p-2 shadow-xl border border-[#FFE0B2] flex justify-between md:justify-center gap-2 overflow-x-auto">
          {[
            { id: 'config', label: 'Meu Negócio', icon: Settings, color: 'text-blue-600' },
            { id: 'ingredients', label: 'Despensa', icon: Package, color: 'text-orange-600' },
            { id: 'calculator', label: 'Calculadora', icon: Calculator, color: 'text-[#BF360C]' },
            { id: 'savedRecipes', label: 'Receitas Salvas', icon: List, color: 'text-green-600' },
            { id: 'marketing', label: 'Marketing IA', icon: Sparkles, color: 'text-purple-600' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full font-nunito font-bold text-sm transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-[#FFF3E0] text-[#BF360C] shadow-inner border border-[#FFE0B2]' 
                  : 'text-[#8D6E63] hover:bg-[#FFF8E1] hover:text-[#5D4037]'}
              `}
            >
              <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="max-w-5xl mx-auto px-4 animate-fade-in">
        
        {/* TAB: CONFIGURAÇÃO DO NEGÓCIO */}
        {activeTab === 'config' && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="candy-card p-8 bg-white">
              <h2 className="font-nunito font-bold text-2xl text-[#5D4037] mb-2 flex items-center gap-2">
                <div className="p-2 bg-[#FFF3E0] rounded-xl text-[#E65100]"><ChefHat size={24} /></div>
                Seu Salário
              </h2>
              <p className="text-[#8D6E63] mb-8 leading-relaxed">
                Confeiteira profissional merece salário! Vamos definir quanto você quer tirar por mês e quais são seus gastos fixos.
              </p>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-bold text-[#5D4037] mb-2 ml-1">Quanto você quer ganhar? (Mensal)</label>
                  <div className="relative transform transition-transform group-hover:scale-[1.01]">
                    <span className="absolute left-4 top-3.5 text-[#FF7043] font-bold">R$</span>
                    <input 
                      type="number" 
                      value={businessConfig.salary}
                      onChange={(e) => setBusinessConfig({...businessConfig, salary: e.target.value})}
                      className="candy-input w-full pl-12 p-3 text-lg font-bold"
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-bold text-[#5D4037] mb-2 ml-1">Custos Fixos (MEI, Luz, Água)</label>
                  <div className="relative transform transition-transform group-hover:scale-[1.01]">
                    <span className="absolute left-4 top-3.5 text-[#FF7043] font-bold">R$</span>
                    <input 
                      type="number" 
                      value={businessConfig.fixedCosts}
                      onChange={(e) => setBusinessConfig({...businessConfig, fixedCosts: e.target.value})}
                      className="candy-input w-full pl-12 p-3 text-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="candy-card p-8 bg-[#FFF3E0] border-[#FFE0B2]">
                  <h3 className="font-bold text-xl text-[#E65100] mb-6">Sua Jornada</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#BF360C] uppercase mb-2">Horas / Dia</label>
                      <input 
                        type="number" 
                        value={businessConfig.hoursPerDay}
                        onChange={(e) => setBusinessConfig({...businessConfig, hoursPerDay: e.target.value})}
                        className="candy-input w-full p-3 text-center text-xl font-bold text-[#BF360C] border-[#FFCC80] focus:border-[#E65100] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#BF360C] uppercase mb-2">Dias / Semana</label>
                      <input 
                        type="number" 
                        value={businessConfig.daysPerWeek}
                        onChange={(e) => setBusinessConfig({...businessConfig, daysPerWeek: e.target.value})}
                        className="candy-input w-full p-3 text-center text-xl font-bold text-[#BF360C] border-[#FFCC80] focus:border-[#E65100] bg-white"
                      />
                    </div>
                  </div>
               </div>

               <div className="candy-card p-8 bg-[#3E2723] text-white border-none relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FF7043] rounded-full blur-3xl opacity-20"></div>
                  <div className="relative z-10">
                    <p className="text-[#D7CCC8] font-bold text-sm uppercase tracking-widest mb-2">Valor da sua Hora</p>
                    <div className="text-5xl font-pacifico text-[#FFCC80] mb-2">
                      {formatMoney(hourlyRate)}
                    </div>
                    <p className="text-[#BCAAA4] text-sm">Esse valor será incluído automaticamente nas suas receitas!</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB: INGREDIENTES */}
        {activeTab === 'ingredients' && (
          <div className="space-y-8">
            <div className="candy-card p-6 md:p-8 bg-white">
              <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8 bg-[#FFF8E1] p-6 rounded-3xl border border-[#FFE0B2]">
                <div className="flex-1">
                  <label className="text-xs font-bold text-[#E65100] uppercase ml-2 mb-1 block">Novo Ingrediente</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Leite Ninho 400g"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                    className="candy-input w-full p-3"
                  />
                </div>
                <div className="w-32">
                  <label className="text-xs font-bold text-[#E65100] uppercase ml-2 mb-1 block">Peso (g)</label>
                  <input 
                    type="number" 
                    placeholder="400"
                    value={newIngredient.packageWeight}
                    onChange={(e) => setNewIngredient({...newIngredient, packageWeight: e.target.value})}
                    className="candy-input w-full p-3"
                  />
                </div>
                <div className="w-32">
                  <label className="text-xs font-bold text-[#E65100] uppercase ml-2 mb-1 block">Preço</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={newIngredient.cost}
                    onChange={(e) => setNewIngredient({...newIngredient, cost: e.target.value})}
                    className="candy-input w-full p-3"
                  />
                </div>
                <button 
                  onClick={handleAddIngredientToDb}
                  className="btn-primary h-[50px] w-[50px] rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg hover:scale-105 transition-transform"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredients.map(ing => (
                  <div key={ing.id} className="group bg-white border border-[#FFE0B2] rounded-2xl p-4 flex justify-between items-center hover:shadow-lg hover:border-[#FFCC80] transition-all">
                    <div>
                      <h4 className="font-bold text-[#5D4037]">{ing.name}</h4>
                      <p className="text-xs text-[#8D6E63] mt-1">
                        {ing.packageWeight}g • <span className="text-[#BF360C] font-bold">{formatMoney(ing.cost)}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono bg-[#FFF3E0] text-[#E65100] px-2 py-1 rounded-lg border border-[#FFE0B2]">
                        {formatMoney(ing.cost / ing.packageWeight).replace('R$', '')}/g
                      </span>
                      <button 
                        onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                        className="text-[#D7CCC8] hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CALCULADORA */}
        {activeTab === 'calculator' && (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Esquerda: Card da Receita */}
            <div className="lg:col-span-2 space-y-6">
              <div className="candy-card p-8 relative overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E65100] via-[#FF7043] to-[#FFCC80]"></div>
                
                <div className="mb-8">
                  <label className="block text-xs font-bold text-[#8D6E63] uppercase mb-2 ml-1">Nome da Receita</label>
                  <input 
                    type="text" 
                    value={recipe.name}
                    onChange={(e) => setRecipe({...recipe, name: e.target.value})}
                    className="candy-input w-full text-3xl font-pacifico text-[#BF360C] p-2 border-none focus:ring-0 bg-transparent placeholder-[#FFCC80]"
                    placeholder="Nome do Doce..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#FFF3E0] rounded-2xl p-4 border border-[#FFE0B2]">
                    <div className="flex items-center gap-2 mb-2 text-[#E65100]">
                      <Package size={18} />
                      <span className="font-bold text-sm uppercase">Rendimento</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <input 
                        type="number" 
                        value={recipe.yields}
                        onChange={(e) => setRecipe({...recipe, yields: parseFloat(e.target.value)})}
                        className="bg-transparent text-2xl font-bold text-[#5D4037] w-20 outline-none border-b border-[#FFCC80] focus:border-[#E65100]"
                      />
                      <span className="text-sm text-[#8D6E63]">unidades</span>
                    </div>
                  </div>

                  <div className="bg-[#ECEFF1] rounded-2xl p-4 border border-[#CFD8DC]">
                    <div className="flex items-center gap-2 mb-2 text-[#546E7A]">
                      <Clock size={18} />
                      <span className="font-bold text-sm uppercase">Tempo</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <input 
                        type="number" 
                        value={recipe.timeSpentMinutes}
                        onChange={(e) => setRecipe({...recipe, timeSpentMinutes: parseFloat(e.target.value)})}
                        className="bg-transparent text-2xl font-bold text-[#37474F] w-20 outline-none border-b border-[#B0BEC5] focus:border-[#546E7A]"
                      />
                      <span className="text-sm text-[#78909C]">minutos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-[#5D4037]">Ingredientes</h3>
                    <div className="relative">
                       <select 
                        value="" 
                        onChange={(e) => {
                          handleAddIngredientToRecipe(e.target.value);
                        }}
                        className="appearance-none bg-[#FFF8E1] hover:bg-[#FFE0B2] text-[#5D4037] pl-4 pr-8 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors outline-none border border-[#FFE0B2]"
                      >
                        <option value="" disabled>+ Adicionar Item</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8D6E63]">
                        <Plus size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {recipe.selectedIngredients.map((item) => {
                      const ingredient = ingredients.find(i => i.id === item.id);
                      if (!ingredient) return null;
                      const itemCost = (ingredient.cost / ingredient.packageWeight) * item.quantity;
                      
                      return (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-white border border-[#FFE0B2] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <p className="font-bold text-[#5D4037]">{ingredient.name}</p>
                            <p className="text-xs text-[#8D6E63]">Emb. {ingredient.packageWeight}g</p>
                          </div>
                          <div className="flex items-center gap-2 bg-[#FFF8E1] rounded-lg px-2 py-1 border border-[#FFE0B2]">
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => updateIngredientQuantity(item.id, e.target.value)}
                              className="w-16 text-right bg-transparent font-bold text-[#5D4037] outline-none border-b border-[#FFCC80] focus:border-[#E65100]"
                            />
                            <span className="text-xs font-bold text-[#8D6E63]">g</span>
                          </div>
                          <div className="w-20 text-right font-bold text-[#BF360C]">
                            {formatMoney(itemCost)}
                          </div>
                          <button 
                            onClick={() => removeIngredientFromRecipe(item.id)}
                            className="text-[#D7CCC8] hover:text-red-400 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    
                    {recipe.selectedIngredients.length === 0 && (
                      <div className="text-center py-12 bg-[#FFF8E1] rounded-2xl border-2 border-dashed border-[#FFE0B2] text-[#8D6E63]">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Sua receita está vazia. Adicione ingredientes!</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                    onClick={handleSaveRecipe}
                    className="mt-6 w-full btn-primary text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
                >
                    <Save size={20} /> Salvar Receita
                </button>
              </div>
            </div>

            {/* Direita: Resultados */}
            <div className="space-y-6">
              
              <div className="candy-card p-6 bg-white">
                <h3 className="font-bold text-[#5D4037] mb-4 flex items-center gap-2">
                  <TrendingUp className="text-[#E65100]" size={20} /> Lucro Desejado
                </h3>
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-3xl font-bold text-[#5D4037]">{recipe.profitMargin}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={recipe.profitMargin} 
                    onChange={(e) => setRecipe({...recipe, profitMargin: parseFloat(e.target.value)})}
                    className="w-full h-3 bg-[#FFF3E0] rounded-full appearance-none cursor-pointer accent-[#E65100]"
                  />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#FFF8E1]">
                    <span className="text-[#8D6E63]">Ingredientes</span>
                    <span className="font-bold text-[#5D4037]">{formatMoney(results.totalIngredientsCost)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#FFF8E1]">
                    <span className="text-[#8D6E63] flex items-center gap-1">Custos Variáveis <span className="text-[10px] bg-[#FFF3E0] text-[#E65100] px-1 rounded">10%</span></span>
                    <span className="font-bold text-[#5D4037]">{formatMoney(results.variableCosts)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#FFF8E1]">
                    <span className="text-[#8D6E63] flex items-center gap-1">Mão de Obra</span>
                    <span className="font-bold text-[#5D4037]">{formatMoney(results.laborCost)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="font-bold text-[#5D4037]">Custo Total</span>
                    <span className="font-bold text-[#3E2723]">{formatMoney(results.totalProductionCost)}</span>
                  </div>
                   <div className="flex justify-between py-2 px-3 bg-[#E8F5E9] rounded-xl text-[#2E7D32]">
                    <span className="font-bold">Seu Lucro</span>
                    <span className="font-bold">+{formatMoney(results.profitValue)}</span>
                  </div>
                </div>
              </div>

              <div className="relative group cursor-default">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#BF360C] to-[#E65100] rounded-[30px] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative candy-card p-8 bg-gradient-to-br from-white to-[#FFF3E0] text-center border-white/50">
                  <p className="text-[#FF7043] text-xs font-bold uppercase tracking-widest mb-2">Preço de Venda Sugerido</p>
                  <div className="text-5xl font-pacifico text-[#BF360C] mb-2 drop-shadow-sm">
                    {formatMoney(results.pricePerUnit)}
                  </div>
                  <p className="text-[#8D6E63] text-sm">por unidade</p>
                  
                  <div className="mt-6 pt-6 border-t border-[#FFE0B2]">
                    <p className="text-[#8D6E63] text-sm">Faturamento da receita</p>
                    <p className="text-xl font-bold text-[#E65100]">{formatMoney(results.totalSalePrice)}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
        
        {/* TAB: RECEITAS SALVAS */}
        {activeTab === 'savedRecipes' && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-[#5D4037] mb-6 flex items-center gap-2">
              <List className="text-green-600" /> Minhas Receitas Salvas
            </h2>
            
            {savedRecipes.length === 0 ? (
              <div className="candy-card p-12 text-center bg-[#FAFAFA] border-dashed border-[#FFE0B2] text-[#8D6E63]">
                <Save size={48} className="mx-auto mb-4 text-[#FFCC80] opacity-70" />
                <p className="font-bold text-lg">Nenhuma receita salva ainda!</p>
                <p>Vá para a Calculadora, preencha sua receita e clique em "Salvar Receita".</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map(r => (
                  <div key={r.id} className="candy-card p-5 bg-white border border-green-100 shadow-md">
                    <h3 className="font-pacifico text-2xl text-[#BF360C] mb-1">{r.name}</h3>
                    <p className="text-xs text-[#8D6E63] mb-4">Salva em: {r.savedAt}</p>
                    
                    <div className="space-y-1 text-sm border-t border-[#FFF3E0] pt-3">
                        <div className="flex justify-between text-[#3E2723]">
                            <span className="font-bold">Rendimento:</span>
                            <span>{r.yields} unidades</span>
                        </div>
                        <div className="flex justify-between text-[#8D6E63]">
                            <span>Tempo de preparo:</span>
                            <span>{r.timeSpentMinutes} min</span>
                        </div>
                        <div className="flex justify-between text-[#8D6E63]">
                            <span>Lucro Desejado:</span>
                            <span>{r.profitMargin}%</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-bold pt-2 border-t border-[#FFE0B2]">
                            <span>Valor da Hora (No salvamento):</span>
                            <span>{formatMoney(r.hourlyRate)}</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => handleLoadRecipe(r.id)}
                            className="flex-1 bg-green-500 text-white p-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors"
                        >
                            Carregar
                        </button>
                        <button
                            onClick={() => handleDeleteRecipe(r.id, r.name)}
                            className="bg-red-400 text-white p-2 rounded-lg text-sm hover:bg-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}

        {/* TAB: MARKETING COM IA */}
        {activeTab === 'marketing' && (
          <div className="grid md:grid-cols-3 gap-8 items-start">
            
            <div className="space-y-4">
              <div className="candy-card p-6 bg-gradient-to-br from-[#5E35B1] to-[#4527A0] text-white border-none shadow-xl">
                <h2 className="text-2xl font-pacifico mb-4 flex items-center gap-2">
                  <Sparkles className="text-[#FFD740] animate-pulse" /> Assistente Mágica
                </h2>
                <p className="text-[#D1C4E9] text-sm mb-8 leading-relaxed opacity-90">
                  Eu uso Inteligência Artificial para criar textos que dão água na boca. Escolha o que você precisa para vender seu <strong>{recipe.name}</strong>:
                </p>
                
                <div className="space-y-3">
                  {[
                    { id: 'caption', label: 'Legenda Instagram', desc: 'Texto para foto', icon: Share2, bg: 'bg-[#AB47BC]' },
                    { id: 'sales', label: 'Dicas de Venda', desc: 'Estratégia Rápida', icon: Lightbulb, bg: 'bg-[#FBC02D]' },
                    { id: 'names', label: 'Nomes Gourmet', desc: 'Ideias Chiques', icon: Type, bg: 'bg-[#42A5F5]' },
                  ].map((btn) => (
                    <button 
                      key={btn.id}
                      onClick={() => callGemini(btn.id)}
                      disabled={isAiLoading}
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all disabled:opacity-50 text-left group"
                    >
                      <div className={`${btn.bg} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform text-white`}>
                        <btn.icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{btn.label}</p>
                        <p className="text-xs text-[#EDE7F6]">{btn.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 h-full">
              <div className="candy-card p-8 h-full flex flex-col min-h-[500px] relative bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl text-[#5D4037] flex items-center gap-2">
                    {isAiLoading ? '✨ Preparando a mágica...' : '📝 Resultado'}
                  </h3>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FFAB91]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFF59D]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#A5D6A7]"></div>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#FAFAFA] rounded-xl p-8 border-2 border-dashed border-[#E0E0E0] relative overflow-hidden">
                  {isAiLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#BDBDBD] gap-4">
                       <div className="w-12 h-12 border-4 border-[#B39DDB] border-t-[#673AB7] rounded-full animate-spin"></div>
                       <p className="font-nunito animate-pulse">Misturando as palavras...</p>
                    </div>
                  ) : aiResult ? (
                    <div className="prose prose-orange text-[#616161] whitespace-pre-wrap font-nunito text-lg leading-relaxed">
                      {aiResult}
                    </div>
                  ) : aiError ? (
                    <div className="text-center py-20 text-[#E57373]">
                      <p>{aiError}</p>
                    </div>
                  ) : (
                    <div className="text-center text-[#BDBDBD] py-20 flex flex-col items-center">
                      <Sparkles size={64} className="mb-6 opacity-20" />
                      <p className="text-lg font-bold">Sua lousa mágica está vazia</p>
                      <p className="text-sm">Clique em um dos botões ao lado para começar.</p>
                    </div>
                  )}
                </div>

                {aiResult && (
                  <div className="mt-6 flex justify-end">
                     <button 
                      onClick={() => {navigator.clipboard.writeText(aiResult); alert('Copiado com sucesso! 🧁');}}
                      className="btn-primary px-6 py-3 rounded-full text-white font-bold text-sm transition-transform hover:scale-105 flex items-center gap-2"
                     >
                       Copiar Texto
                     </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default App;

