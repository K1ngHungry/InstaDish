# FatSecret API Setup

To enable health score calculation with real nutritional data, you need to set up FatSecret API credentials.

## 1. Get API Credentials

1. Go to [FatSecret Platform](https://platform.fatsecret.com/api/)
2. Sign up for a free account
3. Create a new application
4. Get your `Client ID` and `Client Secret`

## 2. Set Environment Variables

Create a `.env` file in the `backend` directory with your credentials:

```bash
# FatSecret API Credentials
FATSECRET_CLIENT_ID=your_client_id_here
FATSECRET_CLIENT_SECRET=your_client_secret_here
```

## 3. Free Tier Limits

- **100 API calls per day**
- **10 API calls per hour**
- The system will automatically use fallback estimation when limits are reached

## 4. How It Works

- **API calls are made only for displayed recipes** (5-10 calls per search)
- **Fallback estimation** is used when API is unavailable
- **Health scores** are calculated based on nutritional data from FatSecret
- **Fallback scores** use ingredient-based heuristics

## 5. Health Score Components

- **Nutritional Density**: Protein and fiber content per calorie
- **Macro Balance**: Protein, carbs, and fat ratios
- **Health Risk**: Sodium, sugar, and saturated fat assessment

## 6. Health Levels

- **90-100**: Excellent (green)
- **80-89**: Very Good (light blue)
- **70-79**: Good (yellow)
- **60-69**: Fair (pink)
- **50-59**: Poor (red)
- **<50**: Very Poor (purple)

Without API credentials, the system will use fallback estimation and show "(est.)" next to health scores.
