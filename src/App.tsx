import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { Calculator, Settings, Plus, Trash2, Package, Clock, ChefHat, List, TrendingUp, Lock, Save, LogOut } from 'lucide-react';

// --- 🔒 CONFIGURAÇÃO DO SEU PORTEIRO (FIREBASE) ---
// Seus dados reais configurados:
const firebaseConfig = {
  apiKey: "AIzaSyBvHMHh6jkinWx4K1bKii2eI4SoGkAyqFo",
  authDomain: "chef-de-valor.firebaseapp.com",
  projectId: "chef-de-valor",
  storageBucket: "chef-de-valor.firebasestorage.app",
  messagingSenderId: "401607199442",
  appId: "1:401607199442:web:eed83f4608c5db05d5fb0b",
  measurementId: "G-JR8Z43E95X"
};

// Inicializa a conexão com o Google (Firebase)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- TIPAGEM (Para evitar erros no CodeSandbox) ---
interface Ingredient {
  id: number;
  name: string;
  packageWeight: number;
  cost: number;
}

// --- DADOS INICIAIS DO APP ---
const initialIngredients = [
  { id: 1, name: 'Leite Condensado', packageWeight: 395, cost: 5.50 },
  { id: 2, name: 'Creme de Leite', packageWeight: 200, cost: 3.20 },
  { id: 3, name: 'Chocolate em Pó 50%', packageWeight: 1000, cost: 35.00 },
  { id: 4, name: 'Manteiga', packageWeight: 200, cost: 12.00 },
  { id: 5, name: 'Farinha de Trigo', packageWeight: 1000, cost: 5.00 },
  { id: 6, name: 'Ovos (unidade)', packageWeight: 1, cost: 0.80 },
  { id: 7, name: 'Embalagem Unitária', packageWeight: 1, cost: 1.50 },
];

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
  // Estados de Login e Usuário
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('calculator');
  
  // Configurações de Negócio
  const [businessConfig, setBusinessConfig] = useState(() => {
    const saved = localStorage.getItem('chefdevalor_config');
    return saved ? JSON.parse(saved) : { salary: 3000, fixedCosts: 800, hoursPerDay: 8, daysPerWeek: 5 };
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('chefdevalor_ingredients');
    return saved ? JSON.parse(saved) : initialIngredients;
  });

  const [newIngredient, setNewIngredient] = useState({ name: '', packageWeight: '', cost: '' });

  const [savedRecipes, setSavedRecipes] = useState<any[]>(() => {
    const saved = localStorage.getItem('chefdevalor_saved_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [recipe, setRecipe] = useState<any>(defaultRecipe);

  // Salvar dados automaticamente no navegador
  useEffect(() => { localStorage.setItem('chefdevalor_config', JSON.stringify(businessConfig)); }, [businessConfig]);
  useEffect(() => { localStorage.setItem('chefdevalor_ingredients', JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem('chefdevalor_saved_recipes', JSON.stringify(savedRecipes)); }, [savedRecipes]);

  // Verificar se o usuário já está logado ao abrir o app
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Função de Login Seguro
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Erro ao logar:", error);
      let mensagemErro = "Erro desconhecido.";
      if (error.code === 'auth/invalid-email') mensagemErro = "E-mail inválido.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') mensagemErro = "E-mail ou senha incorretos.";
      if (error.code === 'auth/wrong-password') mensagemErro = "Senha incorreta.";
      
      setLoginError(mensagemErro);
    }
  };

  // Função de Sair
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // --- CÁLCULOS ---
  const calculateHourlyRate = () => {
    const weeksPerMonth = 4.28;
    const totalHoursMonth = parseFloat(businessConfig.hoursPerDay) * parseFloat(businessConfig.daysPerWeek) * weeksPerMonth;
    const totalCost = parseFloat(businessConfig.salary) + parseFloat(businessConfig.fixedCosts);
    return totalHoursMonth > 0 ? totalCost / totalHoursMonth : 0;
  };

  const hourlyRate = calculateHourlyRate();

  const calculateRecipeCosts = () => {
    let totalIngredientsCost = 0;
    recipe.selectedIngredients.forEach((item: any) => {
      const ingredient = ingredients.find((i) => i.id === item.id);
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

    return { totalIngredientsCost, variableCosts, laborCost, totalProductionCost, profitValue, totalSalePrice, pricePerUnit };
  };

  const results = calculateRecipeCosts();
  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- HANDLERS ---
  const handleAddIngredientToDb = () => {
    if (newIngredient.name && newIngredient.cost && newIngredient.packageWeight) {
      setIngredients([...ingredients, { 
        ...newIngredient, 
        id: Date.now(), 
        packageWeight: parseFloat(newIngredient.packageWeight), 
        cost: parseFloat(newIngredient.cost) 
      } as Ingredient]);
      setNewIngredient({ name: '', packageWeight: '', cost: '' });
    }
  };

  const handleAddIngredientToRecipe = (idStr: string) => {
    const id = parseInt(idStr);
    if (!id) return;
    if (!recipe.selectedIngredients.find((i: any) => i.id === id)) {
      setRecipe({ ...recipe, selectedIngredients: [...recipe.selectedIngredients, { id, quantity: 0 }] });
    }
  };

  const updateIngredientQuantity = (id: number, qty: string) => {
    const updated = recipe.selectedIngredients.map((item: any) => item.id === id ? { ...item, quantity: parseFloat(qty) || 0 } : item);
    setRecipe({ ...recipe, selectedIngredients: updated });
  };

  const removeIngredientFromRecipe = (id: number) => {
    setRecipe({ ...recipe, selectedIngredients: recipe.selectedIngredients.filter((i: any) => i.id !== id) });
  };

  const handleSaveRecipe = () => {
    if (!recipe.name) return alert("Dê um nome para a receita!");
    const newSaved = { ...recipe, id: Date.now(), savedAt: new Date().toLocaleString(), hourlyRate: hourlyRate.toFixed(2) };
    setSavedRecipes([...savedRecipes, newSaved]);
    alert("Receita Salva!");
    setActiveTab('savedRecipes');
  };

  const handleLoadRecipe = (id: number) => {
    const found = savedRecipes.find((r) => r.id === id);
    if (found) {
      setRecipe({ ...found, profitMargin: found.profitMargin || 30 });
      alert("Receita Carregada!");
      setActiveTab('calculator');
    }
  };

  const handleDeleteRecipe = (id: number) => {
    if (window.confirm("Deletar receita?")) {
      setSavedRecipes(savedRecipes.filter((r) => r.id !== id));
    }
  };

  // TELA DE CARREGAMENTO
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse text-xl">Carregando Chef de Valor...</div>;
  }

  // TELA DE LOGIN (Se não estiver logado)
  if (!user) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4 font-sans text-gray-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-pink-100">
          <div className="text-4xl mb-4">🧁</div>
          <h1 className="text-3xl font-bold text-pink-600 mb-2">Chef de Valor</h1>
          <p className="text-gray-500 mb-6">Acesso Exclusivo para Alunas</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Seu E-mail" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3 border border-pink-200 rounded-lg text-center outline-none focus:border-pink-500"
              required
            />
            <input 
              type="password" 
              placeholder="Sua Senha" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3 border border-pink-200 rounded-lg text-center outline-none focus:border-pink-500"
              required
            />
            
            {loginError && <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded">{loginError}</p>}

            <button type="submit" className="w-full bg-pink-500 text-white p-3 rounded-lg font-bold hover:bg-pink-600 shadow-lg transition-transform active:scale-95">
              Entrar 🔒
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-6">Esqueceu a senha? Contate o suporte.</p>
        </div>
      </div>
    );
  }

  // APP PRINCIPAL (Só aparece se tiver logado)
  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800 pb-20">
      <header className="bg-white border-b border-pink-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧁</span>
            <h1 className="text-xl font-bold text-pink-600 hidden sm:block">Chef de Valor</h1>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-gray-400 hidden sm:inline">{user.email}</span>
             <button onClick={handleLogout} className="text-xs text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-1 font-bold transition-colors">
               Sair <LogOut size={14}/>
             </button>
          </div>
        </div>
        <nav className="max-w-4xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'config', label: '⚙️ Negócio' },
            { id: 'ingredients', label: '📦 Despensa' },
            { id: 'calculator', label: '🧮 Calculadora' },
            { id: 'savedRecipes', label: '📂 Salvas' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {activeTab === 'config' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">⚙️ Configuração do Ateliê</h2>
            <p className="text-sm text-gray-400">Defina seus custos para calcular o valor da sua hora.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Salário Desejado (R$)</label>
                <input type="number" value={businessConfig.salary} onChange={(e) => setBusinessConfig({...businessConfig, salary: e.target.value})} className="w-full p-3 border rounded-xl font-bold text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custos Fixos (R$)</label>
                <input type="number" value={businessConfig.fixedCosts} onChange={(e) => setBusinessConfig({...businessConfig, fixedCosts: e.target.value})} className="w-full p-3 border rounded-xl font-bold text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horas / Dia</label>
                <input type="number" value={businessConfig.hoursPerDay} onChange={(e) => setBusinessConfig({...businessConfig, hoursPerDay: e.target.value})} className="w-full p-3 border rounded-xl font-bold text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dias / Semana</label>
                <input type="number" value={businessConfig.daysPerWeek} onChange={(e) => setBusinessConfig({...businessConfig, daysPerWeek: e.target.value})} className="w-full p-3 border rounded-xl font-bold text-gray-700" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-2xl text-center mt-4 shadow-lg">
              <p className="text-sm opacity-90 mb-1">Sua hora de trabalho vale:</p>
              <p className="text-4xl font-bold">{formatMoney(hourlyRate)}</p>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">📦 Despensa de Ingredientes</h2>
            
            {/* Formulário Novo Ingrediente */}
            <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 grid md:grid-cols-4 gap-4 items-end shadow-sm">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-700 uppercase mb-1 block">Nome do Item</label>
                <input type="text" placeholder="Ex: Leite Condensado" value={newIngredient.name} onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})} className="w-full p-2 border border-yellow-200 rounded-lg focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-yellow-700 uppercase mb-1 block">Peso (g/ml)</label>
                <input type="number" placeholder="Ex: 395" value={newIngredient.packageWeight} onChange={(e) => setNewIngredient({...newIngredient, packageWeight: e.target.value})} className="w-full p-2 border border-yellow-200 rounded-lg focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-yellow-700 uppercase mb-1 block">Preço Pago (R$)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="0.00" value={newIngredient.cost} onChange={(e) => setNewIngredient({...newIngredient, cost: e.target.value})} className="w-full p-2 border border-yellow-200 rounded-lg focus:outline-none focus:border-yellow-500" />
                  <button onClick={handleAddIngredientToDb} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 font-bold shadow-md transition-transform active:scale-95">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className="grid gap-2">
              {ingredients.map((ing) => (
                <div key={ing.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div>
                    <p className="font-bold text-gray-800">{ing.name}</p>
                    <p className="text-xs text-gray-500">{formatMoney(ing.cost)} • {ing.packageWeight}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{formatMoney(ing.cost / ing.packageWeight)}/g</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* Esquerda: Dados */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 space-y-4">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calculator className="text-pink-500"/> Calculadora</h2>
                   <button onClick={handleSaveRecipe} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold hover:bg-green-200 flex items-center gap-1 transition-colors">
                     <Save size={14}/> Salvar
                   </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Receita</label>
                  <input type="text" value={recipe.name} onChange={(e) => setRecipe({...recipe, name: e.target.value})} className="w-full p-3 border rounded-xl font-bold text-lg text-pink-600 focus:border-pink-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rendimento (un)</label>
                    <input type="number" value={recipe.yields} onChange={(e) => setRecipe({...recipe, yields: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tempo Gasto (min)</label>
                    <input type="number" value={recipe.timeSpentMinutes} onChange={(e) => setRecipe({...recipe, timeSpentMinutes: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg font-bold" />
                  </div>
                </div>
                
                <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Ingrediente da Despensa</label>
                  <div className="relative">
                    <select value="" onChange={(e) => handleAddIngredientToRecipe(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 cursor-pointer appearance-none hover:bg-white transition-colors">
                        <option value="" disabled>+ Clique para selecionar...</option>
                        {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 text-gray-400 pointer-events-none"><Plus size={16} /></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {recipe.selectedIngredients.map((item) => {
                    const ing = ingredients.find((i) => i.id === item.id);
                    if (!ing) return null;
                    const itemTotalCost = (ing.cost / ing.packageWeight) * item.quantity;
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-700">{ing.name}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2">
                          <input type="number" value={item.quantity} onChange={(e) => updateIngredientQuantity(item.id, e.target.value)} className="w-16 p-1 bg-transparent text-right font-bold outline-none" />
                          <span className="text-xs text-gray-500 font-bold">g</span>
                        </div>
                        <div className="w-20 text-right text-xs font-bold text-gray-500">
                            {formatMoney(itemTotalCost)}
                        </div>
                        <button onClick={() => removeIngredientFromRecipe(item.id)} className="text-gray-300 hover:text-red-500 font-bold px-2 transition-colors">
                            <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {recipe.selectedIngredients.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Nenhum ingrediente adicionado ainda.</p>}
                </div>
                <button onClick={handleSaveRecipe} className="w-full bg-green-500 text-white p-3 rounded-xl font-bold mt-4 hover:bg-green-600 shadow-md transition-transform active:scale-95">Salvar Receita 💾</button>
              </div>
            </div>

            {/* Direita: Resultados */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="text-green-500"/> Margem de Lucro</h3>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">Lucro da Empresa:</span>
                    <span className="font-bold text-2xl text-pink-600">{recipe.profitMargin}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={recipe.profitMargin} onChange={(e) => setRecipe({...recipe, profitMargin: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                </div>
                
                <div className="space-y-3 text-sm border-t border-dashed pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Ingredientes:</span> 
                    <span className="font-bold">{formatMoney(results.totalIngredientsCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Custos Variáveis (Gás/Luz 10%):</span> 
                    <span className="font-bold">{formatMoney(results.variableCosts)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <span>Mão de Obra (Salário):</span> 
                    <span className="font-bold">{formatMoney(results.laborCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-gray-800 text-base">
                    <span>Custo de Produção:</span> 
                    <span>{formatMoney(results.totalProductionCost)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                    <span>Lucro Líquido:</span> 
                    <span>+{formatMoney(results.profitValue)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl shadow-xl p-8 text-white text-center transform transition-transform hover:scale-[1.02]">
                <p className="text-xs font-bold uppercase opacity-80 mb-1 tracking-widest">Preço Sugerido de Venda</p>
                <div className="text-5xl font-extrabold mb-2">{formatMoney(results.pricePerUnit)}</div>
                <p className="text-sm opacity-90">por unidade</p>
                
                <div className="mt-6 pt-4 border-t border-white/20 flex justify-between text-xs opacity-70">
                    <span>Faturamento Total:</span>
                    <span>{formatMoney(results.totalSalePrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'savedRecipes' && (
          <div className="animate-fade-in">
             <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><List className="text-pink-500"/> Minhas Receitas</h2>
             <div className="grid md:grid-cols-2 gap-4">
                {savedRecipes.length === 0 && <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400"><Package size={48} className="mx-auto mb-2 opacity-20"/><p>Você ainda não salvou nenhuma receita.</p></div>}
                {savedRecipes.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-pink-600">{r.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">{r.savedAt}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4 flex gap-4">
                        <span>📦 {r.yields} un</span>
                        <span>⏱️ {r.timeSpentMinutes} min</span>
                        <span>💰 {r.profitMargin}%</span>
                    </div>
                    <div className="flex gap-2">
                    <button onClick={() => handleLoadRecipe(r.id)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">Abrir na Calculadora</button>
                    <button onClick={() => handleDeleteRecipe(r.id)} className="px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={18} />
                    </button>
                    </div>
                </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
