#!/bin/bash

# 🚀 CriaFX Pro - Setup Git & Deploy Script

echo "🎵 CriaFX Pro - GitHub Setup"
echo "=============================="
echo ""

# 1. Inicializar Git (se não estiver iniciado)
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositório Git..."
    git init
    echo "✅ Git inicializado!"
else
    echo "✅ Git já inicializado!"
fi

echo ""

# 2. Configurar repositório remoto
echo "🔗 Configurando repositório remoto..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/Rhuan-Mendanha/CriaFX-Pro.git
echo "✅ Remoto configurado!"

echo ""

# 3. Adicionar todos os arquivos
echo "📝 Adicionando arquivos..."
git add .
echo "✅ Arquivos adicionados!"

echo ""

# 4. Commit inicial
echo "💾 Criando commit..."
git commit -m "🎵 Initial commit - CriaFX Pro v1.0

Features:
- 🎵 YouTube integration
- 📁 Local file support
- 🌈 6 visual effects
- 🎚️ Smart equalizer
- 📱 Responsive design
- 🌓 Dark/Light theme
- 🎯 Queue system"

echo "✅ Commit criado!"

echo ""

# 5. Renomear para main e fazer push
echo "🚀 Fazendo push para GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "=============================="
echo "✅ DEPLOY COMPLETO!"
echo "=============================="
echo ""
echo "🌐 Seu site estará online em ~2 minutos:"
echo "   https://rhuan-mendanha.github.io/CriaFX-Pro/"
echo ""
echo "📊 Acompanhe o deploy:"
echo "   https://github.com/Rhuan-Mendanha/CriaFX-Pro/actions"
echo ""
echo "⚙️ Configure GitHub Pages:"
echo "   1. Acesse: https://github.com/Rhuan-Mendanha/CriaFX-Pro/settings/pages"
echo "   2. Em 'Source', selecione: GitHub Actions"
echo "   3. Aguarde o deploy terminar"
echo ""
echo "🎉 Pronto para compartilhar!"
