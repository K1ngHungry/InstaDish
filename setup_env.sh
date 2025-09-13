#!/bin/bash

# InstaDish Environment Setup Script
echo "🔧 Setting up InstaDish environment..."

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the InstaDish root directory"
    exit 1
fi

echo "Choose your environment setup:"
echo "1) Separate .env files (recommended for production)"
echo "2) Single root .env file (simpler for development)"
echo "3) Skip setup"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "📁 Setting up separate .env files..."
        
        # Backend .env
        if [ ! -f "backend/.env" ]; then
            cp backend/env.example backend/.env
            echo "✅ Created backend/.env"
        else
            echo "⚠️ backend/.env already exists, skipping..."
        fi
        
        # Frontend .env
        if [ ! -f "frontend/.env" ]; then
            cp frontend/env.example frontend/.env
            echo "✅ Created frontend/.env"
        else
            echo "⚠️ frontend/.env already exists, skipping..."
        fi
        
        echo ""
        echo "📝 Next steps:"
        echo "1. Edit backend/.env with your FatSecret API credentials"
        echo "2. Edit frontend/.env if you need to change the API URL"
        echo "3. Run ./start_app.sh to start the application"
        ;;
        
    2)
        echo "📄 Setting up single root .env file..."
        
        if [ ! -f ".env" ]; then
            cp env.example .env
            echo "✅ Created .env"
        else
            echo "⚠️ .env already exists, skipping..."
        fi
        
        echo ""
        echo "📝 Next steps:"
        echo "1. Edit .env with your configuration"
        echo "2. Run ./start_app.sh to start the application"
        echo ""
        echo "✅ Backend services have been updated to use root .env file"
        echo "✅ Frontend will automatically use root .env file"
        ;;
        
    3)
        echo "⏭️ Skipping environment setup"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo "💡 Tip: You can always run this script again to change your setup"
