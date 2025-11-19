import React, { useState } from 'react';
import { Calculator, DollarSign, Settings, Plus, Trash2, Package, Clock, ChefHat, Sparkles, Share2, Lightbulb, Type, Heart, TrendingUp } from 'lucide-react';

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

const App = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  
  // Estado do Negócio (Configurações)
  const [businessConfig, setBusinessConfig] = useState({
    salary: 3000,
    fixedCosts: 800,
    hoursPerDay: 8,
    daysPerWeek: 5,
  });

  // Estado dos Ingredientes
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [newIngredient, setNewIngredient] = useState({ name: '', packageWeight: '', cost: '' });

  // Estado da Receita Atual
  const [recipe, setRecipe] = useState({
    name: 'Brigadeiro Gourmet',
    yields: 20,
    timeSpentMinutes: 60,
    profitMargin: 30,
    selectedIngredients: [
      { id: 1, quantity: 395 },
      { id: 2, quantity: 100 },
      { id: 3, quantity: 40 },
      { id: 4, quantity: 20 },
    ]
  });

  // Estados para a IA (Gemini)
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

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
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

  // --- HANDLERS ---
  const handleAddIngredientToDb = () => {
    if (newIngredient.name && newIngredient.cost && newIngredient.packageWeight) {
      setIngredients([...ingredients, { ...newIngredient, id: Date.now(), packageWeight: parseFloat(newIngredient.packageWeight), cost: parseFloat(newIngredient.cost) }]);
      setNewIngredient({ name: '', packageWeight: '', cost: '' });
    }
  };

  const handleAddIngredientToRecipe = (ingredientId) => {
    if (!ingredientId) return;
    if (!recipe.selectedIngredients.find(i => i.id === parseInt(ingredientId))) {
      setRecipe({
        ...recipe,
        selectedIngredients: [...recipe.selectedIngredients, { id: parseInt(ingredientId), quantity: 0 }]
      });
    }
  };

  const updateIngredientQuantity = (id, quantity) => {
    const updated = recipe.selectedIngredients.map(item => 
      item.id === id ? { ...item, quantity: parseFloat(quantity) || 0 } : item
    );
    setRecipe({ ...recipe, selectedIngredients: updated });
  };

  const removeIngredientFromRecipe = (id) => {
    setRecipe({
      ...recipe,
      selectedIngredients: recipe.selectedIngredients.filter(item => item.id !== id)
    });
  };

  const formatMoney = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-[#fff5f7] font-['Nunito'] text-stone-700 pb-20">
      {/* Inject Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Pacifico&display=swap');
        
        .font-pacifico { font-family: 'Pacifico', cursive; }
        .font-nunito { font-family: 'Nunito', sans-serif; }
        
        .candy-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          box-shadow: 0 10px 30px -10px rgba(255, 182, 193, 0.4);
          border: 2px solid white;
        }

        .candy-input {
          background: #fff;
          border: 2px solid #ffe4e6;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .candy-input:focus {
          border-color: #f472b6;
          box-shadow: 0 0 0 4px rgba(244, 114, 182, 0.1);
          outline: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f472b6 0%, #db2777 100%);
          box-shadow: 0 4px 15px rgba(219, 39, 119, 0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(219, 39, 119, 0.4);
        }
      `}</style>

      {/* Hero Header */}
      <header className="relative bg-gradient-to-b from-pink-100 to-[#fff5f7] pt-10 pb-16 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg mb-4">
            <span className="text-2xl">🍰</span>
          </div>
          <h1 className="font-pacifico text-5xl text-pink-500 mb-2 drop-shadow-sm">Doce Precificação</h1>
          <p className="text-stone-500 font-nunito text-lg max-w-xl mx-auto">
            Transforme suas receitas deliciosas em um negócio lucrativo com a magia da organização.
          </p>
        </div>
      </header>

      {/* Floating Navigation */}
      <div className="sticky top-4 z-50 max-w-3xl mx-auto px-4 mb-8">
        <nav className="bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg border border-white flex justify-between md:justify-center gap-2 overflow-x-auto">
          {[
            { id: 'config', label: 'Meu Negócio', icon: Settings, color: 'text-blue-400' },
            { id: 'ingredients', label: 'Despensa', icon: Package, color: 'text-orange-400' },
            { id: 'calculator', label: 'Calculadora', icon: Calculator, color: 'text-pink-500' },
            { id: 'marketing', label: 'Marketing IA', icon: Sparkles, color: 'text-purple-500' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full font-nunito font-bold text-sm transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 shadow-inner border border-pink-100' 
                  : 'text-stone-400 hover:bg-white hover:text-stone-600'}
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
            <div className="candy-card p-8">
              <h2 className="font-nunito font-bold text-2xl text-stone-700 mb-2 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-500"><ChefHat size={24} /></div>
                Seu Salário
              </h2>
              <p className="text-stone-400 mb-8 leading-relaxed">
                Confeiteira profissional merece salário! Vamos definir quanto você quer tirar por mês e quais são seus gastos fixos.
              </p>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-bold text-stone-600 mb-2 ml-1">Quanto você quer ganhar? (Mensal)</label>
                  <div className="relative transform transition-transform group-hover:scale-[1.01]">
                    <span className="absolute left-4 top-3.5 text-pink-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      value={businessConfig.salary}
                      onChange={(e) => setBusinessConfig({...businessConfig, salary: e.target.value})}
                      className="candy-input w-full pl-12 p-3 text-lg font-bold text-stone-700"
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-bold text-stone-600 mb-2 ml-1">Custos Fixos (MEI, Luz, Água)</label>
                  <div className="relative transform transition-transform group-hover:scale-[1.01]">
                    <span className="absolute left-4 top-3.5 text-pink-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      value={businessConfig.fixedCosts}
                      onChange={(e) => setBusinessConfig({...businessConfig, fixedCosts: e.target.value})}
                      className="candy-input w-full pl-12 p-3 text-lg font-bold text-stone-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="candy-card p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                  <h3 className="font-bold text-xl text-blue-800 mb-6">Sua Jornada</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Horas / Dia</label>
                      <input 
                        type="number" 
                        value={businessConfig.hoursPerDay}
                        onChange={(e) => setBusinessConfig({...businessConfig, hoursPerDay: e.target.value})}
                        className="candy-input w-full p-3 text-center text-xl font-bold text-blue-600 border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Dias / Semana</label>
                      <input 
                        type="number" 
                        value={businessConfig.daysPerWeek}
                        onChange={(e) => setBusinessConfig({...businessConfig, daysPerWeek: e.target.value})}
                        className="candy-input w-full p-3 text-center text-xl font-bold text-blue-600 border-blue-200 focus:border-blue-400"
                      />
                    </div>
                  </div>
               </div>

               <div className="candy-card p-8 bg-stone-800 text-white border-none relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative z-10">
                    <p className="text-stone-300 font-bold text-sm uppercase tracking-widest mb-2">Valor da sua Hora</p>
                    <div className="text-5xl font-pacifico text-pink-300 mb-2">
                      {formatMoney(hourlyRate)}
                    </div>
                    <p className="text-stone-400 text-sm">Esse valor será incluído automaticamente nas suas receitas!</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB: INGREDIENTES */}
        {activeTab === 'ingredients' && (
          <div className="space-y-8">
            <div className="candy-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8 bg-yellow-50/50 p-6 rounded-3xl border border-yellow-100">
                <div className="flex-1">
                  <label className="text-xs font-bold text-orange-400 uppercase ml-2 mb-1 block">Novo Ingrediente</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Leite Ninho 400g"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                    className="candy-input w-full p-3"
                  />
                </div>
                <div className="w-32">
                  <label className="text-xs font-bold text-orange-400 uppercase ml-2 mb-1 block">Peso (g)</label>
                  <input 
                    type="number" 
                    placeholder="400"
                    value={newIngredient.packageWeight}
                    onChange={(e) => setNewIngredient({...newIngredient, packageWeight: e.target.value})}
                    className="candy-input w-full p-3"
                  />
                </div>
                <div className="w-32">
                  <label className="text-xs font-bold text-orange-400 uppercase ml-2 mb-1 block">Preço</label>
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
                  className="btn-primary h-[50px] w-[50px] rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg shadow-pink-200 hover:scale-105 transition-transform"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredients.map(ing => (
                  <div key={ing.id} className="group bg-white border border-stone-100 rounded-2xl p-4 flex justify-between items-center hover:shadow-lg hover:border-pink-100 transition-all">
                    <div>
                      <h4 className="font-bold text-stone-700">{ing.name}</h4>
                      <p className="text-xs text-stone-400 mt-1">
                        {ing.packageWeight}g • <span className="text-pink-500 font-bold">{formatMoney(ing.cost)}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono bg-stone-100 text-stone-500 px-2 py-1 rounded-lg">
                        {formatMoney(ing.cost / ing.packageWeight).replace('R$', '')}/g
                      </span>
                      <button 
                        onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                        className="text-stone-300 hover:text-red-400 transition-colors p-1"
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
              <div className="candy-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300"></div>
                
                <div className="mb-8">
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-2 ml-1">Nome da Receita</label>
                  <input 
                    type="text" 
                    value={recipe.name}
                    onChange={(e) => setRecipe({...recipe, name: e.target.value})}
                    className="candy-input w-full text-3xl font-pacifico text-pink-500 p-2 border-none focus:ring-0 bg-transparent placeholder-pink-200"
                    placeholder="Nome do Doce..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
                    <div className="flex items-center gap-2 mb-2 text-pink-400">
                      <Package size={18} />
                      <span className="font-bold text-sm uppercase">Rendimento</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <input 
                        type="number" 
                        value={recipe.yields}
                        onChange={(e) => setRecipe({...recipe, yields: parseFloat(e.target.value)})}
                        className="bg-transparent text-2xl font-bold text-stone-700 w-20 outline-none border-b border-pink-200 focus:border-pink-400"
                      />
                      <span className="text-sm text-stone-500">unidades</span>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2 text-purple-400">
                      <Clock size={18} />
                      <span className="font-bold text-sm uppercase">Tempo</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <input 
                        type="number" 
                        value={recipe.timeSpentMinutes}
                        onChange={(e) => setRecipe({...recipe, timeSpentMinutes: parseFloat(e.target.value)})}
                        className="bg-transparent text-2xl font-bold text-stone-700 w-20 outline-none border-b border-purple-200 focus:border-purple-400"
                      />
                      <span className="text-sm text-stone-500">minutos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-stone-600">Ingredientes</h3>
                    <div className="relative">
                       <select 
                        value="" // Usamos value="" para resetar e controlar o estado, eliminando o warning.
                        onChange={(e) => {
                          handleAddIngredientToRecipe(e.target.value);
                          // e.target.value = ""; // Removido por conflitar com a lógica do React
                        }}
                        className="appearance-none bg-stone-50 hover:bg-stone-100 text-stone-600 pl-4 pr-8 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors outline-none"
                      >
                        <option value="" disabled>+ Adicionar Item</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
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
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-white border border-stone-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <p className="font-bold text-stone-700">{ingredient.name}</p>
                            <p className="text-xs text-stone-400">Emb. {ingredient.packageWeight}g</p>
                          </div>
                          <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-1">
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => updateIngredientQuantity(item.id, e.target.value)}
                              className="w-16 text-right bg-transparent font-bold text-stone-700 outline-none border-b border-stone-200 focus:border-pink-400"
                            />
                            <span className="text-xs font-bold text-stone-400">g</span>
                          </div>
                          <div className="w-20 text-right font-bold text-pink-500">
                            {formatMoney(itemCost)}
                          </div>
                          <button 
                            onClick={() => removeIngredientFromRecipe(item.id)}
                            className="text-stone-300 hover:text-red-400 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    
                    {recipe.selectedIngredients.length === 0 && (
                      <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Sua receita está vazia. Adicione ingredientes!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Direita: Resultados */}
            <div className="space-y-6">
              
              <div className="candy-card p-6 bg-white">
                <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-500" size={20} /> Lucro Desejado
                </h3>
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-3xl font-bold text-stone-700">{recipe.profitMargin}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={recipe.profitMargin} 
                    onChange={(e) => setRecipe({...recipe, profitMargin: parseFloat(e.target.value)})}
                    className="w-full h-3 bg-stone-100 rounded-full appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-stone-50">
                    <span className="text-stone-500">Ingredientes</span>
                    <span className="font-bold text-stone-700">{formatMoney(results.totalIngredientsCost)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-50">
                    <span className="text-stone-500 flex items-center gap-1">Custos Variáveis <span className="text-[10px] bg-yellow-100 text-yellow-600 px-1 rounded">10%</span></span>
                    <span className="font-bold text-stone-700">{formatMoney(results.variableCosts)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-50">
                    <span className="text-stone-500 flex items-center gap-1">Mão de Obra</span>
                    <span className="font-bold text-stone-700">{formatMoney(results.laborCost)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="font-bold text-stone-600">Custo Total</span>
                    <span className="font-bold text-stone-800">{formatMoney(results.totalProductionCost)}</span>
                  </div>
                   <div className="flex justify-between py-2 px-3 bg-green-50 rounded-xl text-green-700">
                    <span className="font-bold">Seu Lucro</span>
                    <span className="font-bold">+{formatMoney(results.profitValue)}</span>
                  </div>
                </div>
              </div>

              <div className="relative group cursor-default">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[30px] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative candy-card p-8 bg-gradient-to-br from-white to-pink-50 text-center border-white/50">
                  <p className="text-pink-400 text-xs font-bold uppercase tracking-widest mb-2">Preço de Venda Sugerido</p>
                  <div className="text-5xl font-pacifico text-stone-700 mb-2 drop-shadow-sm">
                    {formatMoney(results.pricePerUnit)}
                  </div>
                  <p className="text-stone-400 text-sm">por unidade</p>
                  
                  <div className="mt-6 pt-6 border-t border-pink-100">
                    <p className="text-stone-500 text-sm">Faturamento da receita</p>
                    <p className="text-xl font-bold text-pink-500">{formatMoney(results.totalSalePrice)}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: MARKETING COM IA */}
        {activeTab === 'marketing' && (
          <div className="grid md:grid-cols-3 gap-8 items-start">
            
            <div className="space-y-4">
              <div className="candy-card p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
                <h2 className="text-2xl font-pacifico mb-4 flex items-center gap-2">
                  <Sparkles className="text-yellow-300 animate-pulse" /> Assistente Mágica
                </h2>
                <p className="text-purple-100 text-sm mb-8 leading-relaxed opacity-90">
                  Eu uso Inteligência Artificial para criar textos que dão água na boca. Escolha o que você precisa para vender seu <strong>{recipe.name}</strong>:
                </p>
                
                <div className="space-y-3">
                  {[
                    { id: 'caption', label: 'Legenda Instagram', desc: 'Texto para foto', icon: Share2, bg: 'bg-pink-400' },
                    { id: 'sales', label: 'Dicas de Venda', desc: 'Estratégia Rápida', icon: Lightbulb, bg: 'bg-yellow-400' },
                    { id: 'names', label: 'Nomes Gourmet', desc: 'Ideias Chiques', icon: Type, bg: 'bg-blue-400' },
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
                        <p className="text-xs text-purple-200">{btn.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 h-full">
              <div className="candy-card p-8 h-full flex flex-col min-h-[500px] relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl text-stone-700 flex items-center gap-2">
                    {isAiLoading ? '✨ Preparando a mágica...' : '📝 Resultado'}
                  </h3>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-200"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
                    <div className="w-3 h-3 rounded-full bg-green-200"></div>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#fdfbf7] rounded-xl p-8 border-2 border-dashed border-stone-200 relative overflow-hidden">
                  {isAiLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 gap-4">
                       <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                       <p className="font-nunito animate-pulse">Misturando as palavras...</p>
                    </div>
                  ) : aiResult ? (
                    <div className="prose prose-pink text-stone-600 whitespace-pre-wrap font-nunito text-lg leading-relaxed">
                      {aiResult}
                    </div>
                  ) : aiError ? (
                    <div className="text-center py-20 text-red-400">
                      <p>{aiError}</p>
                    </div>
                  ) : (
                    <div className="text-center text-stone-300 py-20 flex flex-col items-center">
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
