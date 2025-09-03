// src/App.js
import 'react-native-gesture-handler';
import React, {useState, useContext, useEffect} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  Animated,
} from 'react-native';

import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {CartProvider, CartContext} from './context/CartContext';
import RNBootSplash from 'react-native-bootsplash';
import { BlurView } from '@react-native-community/blur';

// 🔐 Auth flow 4 個畫面（你已建立於 src/auth/AuthScreens.js）
import { LoginScreen, ForgotPasswordScreen, VerifyScreen, SignUpScreen } from './auth/AuthScreens';

// 螢幕寬度
const screenWidth = Dimensions.get('window').width;

// Tab / Stack
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();          // 給 Explore 的內層 Stack
const RootStack = createStackNavigator();      // 🔝 最外層 RootStack（含 Auth + Main）

// === Demo 資料 ===
const recipesData = [
  {
    id: '1',
    title: '揚州炒飯',
    description: '揚州炒飯是中式炒飯的經典代表，食材豐富，色彩鮮豔，味道鹹香。',
    ingredients:
      '白飯 2碗（隔夜飯最佳）、蝦仁 80克（去腸泥，洗淨）、叉燒肉 50克（切丁）、青豆仁 30克（冷凍）、雞蛋 2顆（打散）、玉米粒 30克（冷凍）、紅蘿蔔丁 30克（冷凍）、蔥花 2湯匙、醬油 1湯匙、鹽 少許、白胡椒粉 少許。',
    image: require('../assets/recipe_pic/揚州炒飯.jpg'),
  },
  {
    id: '2',
    title: '韓式泡菜豬肉蓋飯',
    description: '酸辣開胃的泡菜豬肉，搭配熱騰騰的白飯，簡單快速又美味。',
    ingredients:
      '豬梅花肉片 150克（切小片）、韓式泡菜 100克（切小段）、洋蔥 1/4顆（切絲）、青蔥 1根（切蔥花）、蒜末 1湯匙、韓式辣醬 1湯匙、醬油 1茶匙、糖 1茶匙、米酒 1湯匙、水 50毫升、白飯 適量、雞蛋 1顆（煎成半熟蛋）。',
    image: require('../assets/recipe_pic/韓式泡菜豬肉蓋飯.jpg'),
  },
  {
    id: '3',
    title: '咖哩燴飯',
    description: '濃郁的咖哩醬汁搭配米飯，是經典的日式或台式家常料理。',
    ingredients:
      '豬肉或雞肉 200克（切塊）、馬鈴薯 1顆（去皮切塊）、紅蘿蔔 1/2根（去皮切塊）、洋蔥 1/2顆（切塊）、咖哩塊 2塊、水 500毫升、沙拉油 適量、白飯 適量。',
    image: require('../assets/recipe_pic/咖哩燴飯.jpeg'),
  },
];

const productsData = [
  {id: '1', name: '銀川有機米', brand: '花蓮縣富里鄉', image: require('../assets/product_rice_pic/rice_1.jpg')},
  {id: '2', name: '富麗有機米', brand: '花蓮縣富里鄉', image: require('../assets/product_rice_pic/rice_2.jpg')},
  {id: '3', name: '東豐有機米', brand: '花蓮縣富里鄉', image: require('../assets/product_rice_pic/rice_3.png')},
  {id: '4', name: '信安有機米', brand: '花蓮縣富里鄉', image: require('../assets/product_rice_pic/rice_4.jpg')},
  {id: '5', name: '花蓮梯田米', brand: '花蓮縣富里鄉', image: require('../assets/product_rice_pic/rice_5.png')},
  {id: '6', name: '哇好米', brand: '花蓮⽟里鎮、卓溪鄉', image: require('../assets/product_rice_pic/rice_6.png')},
];

const categories1 = [
  {id: 'all', name: 'All', icon: null, active: true},
  {id: 'rice', name: '飯食類', icon: null, image: require('../assets/classification_pic/rice.jpg')},
  {id: 'noodle', name: '麵食類', icon: null, image: require('../assets/classification_pic/noodle.jpg')},
  {id: 'soup', name: '湯品/鍋物類', icon: null, image: require('../assets/classification_pic/soup.jpg')},
  {id: 'braised_dishes', name: '燉滷類', icon: null, image: require('../assets/classification_pic/braised_dishes.png')},
  {id: 'stir-fried', name: '熱炒類', icon: null, image: require('../assets/classification_pic/stir-fried.jpg')},
  {id: 'steaming', name: '蒸煮類', icon: null, image: require('../assets/classification_pic/steaming.jpg')},
  {id: 'fried_food', name: '煎炸類', icon: null, image: require('../assets/classification_pic/fried_food.jpg')},
  {id: 'other', name: '其他', icon: null},
];

const categories2 = [
  {id: 'all', name: 'All', icon: null, active: true},
  {id: 'rice', name: '稻米&雜糧', icon: null},
  {id: 'noodle', name: '蔬菜', icon: null},
  {id: 'soup', name: '水果', icon: null},
  {id: 'dessert', name: '加工品&特色產品', icon: null},
  {id: 'drink', name: '花卉', icon: null},
  {id: 'drink2', name: '其他', icon: null},
];

// === 首頁 ===
function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('all');

  const HEADER_HEIGHT = 218;
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 40, 120],
    outputRange: [1, 0.85, 1.5],     // ← 透明度建議 1 → 0.6
    extrapolate: 'clamp',
  });

  const handleRecipePress = () => {
    console.log('推薦食譜按鈕被點擊了！');
    alert('功能待開發！');
  };

  const renderRecipeItem = ({item}) => (
    <TouchableOpacity style={styles.recipeCard} onPress={() => console.log('點擊了食譜:', item.title)}>
      <View style={styles.recipeTextContent}>
        <View style={styles.recipeTitleRow}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <MaterialCommunityIcons name="bookmark-outline" size={20} color="#777" />
        </View>
        <Text style={styles.recipeDescription}>{item.description}</Text>
        <Text style={styles.recipeIngredientsTitle}>所需食材:</Text>
        <Text style={styles.recipeIngredients}>{item.ingredients}</Text>
      </View>
      {item.image && <Image source={item.image} style={styles.recipeImage} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.homeScreenContainer}>
      <Animated.FlatList
        data={recipesData}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.recipeListContent, {paddingTop: HEADER_HEIGHT}]}
        style={styles.recipeList}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      <View style={[styles.headerContainer, {height: HEADER_HEIGHT}]}>
        <Animated.View style={[styles.headerBg, { opacity: bgOpacity }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={12}
            reducedTransparencyFallbackColor="white"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
        </Animated.View>

        <View style={styles.headerTextBlock}>
          <Text style={styles.hualienTextInHome}>花蓮好食智慧聊</Text>
          <Text style={styles.subtitleTextInHome}>今天來煮點什麼呢！</Text>
        </View>

        <View style={styles.topHorizontalLine} />

        <View style={styles.recipeButtonsContainer}>
          <TouchableOpacity style={styles.recipeButton1InHome} onPress={handleRecipePress} activeOpacity={0.7}>
            <Text style={styles.recipeButtonText1}>推薦食譜</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.recipeButton2InHome} onPress={handleRecipePress} activeOpacity={0.7}>
            <Text style={styles.recipeButtonText2}>已收藏食譜</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonUnderlineLeft} />
        <View style={styles.buttonUnderlineRight} />

        <View style={styles.categoryNavigationWrapper1}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catStripContent}>
            {categories1.map(category => {
              const isActive = activeCategory === category.id;

              if (category.id === 'all') {
                return (
                  <TouchableOpacity key={category.id} activeOpacity={0.85} onPress={() => setActiveCategory(category.id)}>
                    <View style={[styles.catAll, isActive && styles.catChipActive]}>
                      <Text style={[styles.catText, isActive && styles.catTextActive]}>{category.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.85}
                  onPress={() => setActiveCategory(category.id)}
                  style={[styles.catChip, isActive && styles.catChipActive]}
                >
                  {category.image && (
                    <View style={[styles.catImgWrap, isActive && styles.catImgWrapActive]}>
                      <Image source={category.image} style={styles.catImg} />
                    </View>
                  )}
                  <Text style={[styles.catText, isActive && styles.catTextActive]}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <StatusBar barStyle="dark-content" />
    </View>
  );
}

// === 聊天頁 ===
function SpecialCenterScreen() {
  const [messages, setMessages] = useState([
    {id: '1', text: '哈嘍？今天吃啥呢？', sender: 'ai'},
    {id: '2', text: '好餓！！', sender: 'user'},
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMessages = [...messages, {id: String(messages.length + 1), text: inputMessage, sender: 'user'}];
    setMessages(newMessages);
    setInputMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, {id: String(prev.length + 1), text: '這是一個模擬的AI回覆。', sender: 'ai'}]);
    }, 1000);
  };

  const renderItem = ({item}) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.specialCenterScreenContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <View style={styles.chatHeader}>
        <Ionicons name="menu-outline" size={30} color="black" />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.hualienTextInHome}>花蓮好食智慧聊</Text>
          <Text style={styles.subtitleTextInHome}>今天來煮點什麼呢！</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <FlatList data={messages} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.messageList} />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputLeftIcon}>
          <Ionicons name="happy-outline" size={24} color="#777" />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Write somethings"
          placeholderTextColor="#BDBDBD"
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="paper-plane-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <StatusBar barStyle="dark-content" />
    </KeyboardAvoidingView>
  );
}

// === Explore + Stack ===
function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const {addToCart} = useContext(CartContext);
  const navigation = useNavigation();

  const renderProductItem = ({item}) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', {product: item})} activeOpacity={0.7}>
      <Image source={item.image} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleShoppingCartPress = () => navigation.navigate('ShoppingCart');

  return (
    <View style={styles.homeScreenContainer}>
      <View style={styles.headerTextBlock}>
        <Text style={styles.hualienTextInHome}>花蓮在地有機農產品</Text>
        <Text style={styles.subtitleTextInHome}>原來花蓮有這麼多在地小農</Text>
      </View>

      <TouchableOpacity style={styles.shoppingCartButton} onPress={handleShoppingCartPress}>
        <Ionicons name="cart-outline" size={30} color="black" />
      </TouchableOpacity>

      {/* 食品分類導航 (可左右滑動) */}
      <View style={styles.categoryNavigationWrapper2}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catStripContent}
        >
          {categories2.map((category) => {
            const isActive = activeCategory === category.id;

            if (category.id === 'all') {
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.85}
                  onPress={() => setActiveCategory(category.id)}
                >
                  <View style={[styles.catAll, isActive && styles.catChipActive]}>
                    <Text style={[styles.catText, isActive && styles.catTextActive]}>
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.85}
                onPress={() => setActiveCategory(category.id)}
                style={[styles.catChip, isActive && styles.catChipActive]}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productListHeader}>
        <Text style={styles.productListTitle}>產品品牌</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.seeAllText}>See All</Text>
          <AntDesign name="right" size={16} color="gray" style={{marginLeft: 5}} />
        </View>
      </View>

      <FlatList
        data={productsData}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.productListContent}
        style={styles.productList}
      />

      <StatusBar barStyle="dark-content" />
    </View>
  );
}

function ShoppingCartScreen() {
  const {cartItems, updateQuantity} = useContext(CartContext);
  const navigation = useNavigation();
  const [selectedForCheckout, setSelectedForCheckout] = useState({});

  const toggleSelectItem = id => setSelectedForCheckout(prev => ({...prev, [id]: !prev[id]}));

  const renderCartItem = ({item}) => {
    const isSelected = !!selectedForCheckout[item.id];
    return (
      <TouchableOpacity style={styles.cartItemContainer} onPress={() => navigation.navigate('ProductDetail', {product: item})}>
        <TouchableOpacity onPress={() => toggleSelectItem(item.id)}>
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={isSelected ? '#FC6E2A' : 'gray'}
          />
        </TouchableOpacity>
        <Image source={item.image} style={styles.cartItemImage} />
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.name}</Text>
          <Text style={styles.cartItemBrand}>{item.brand}</Text>
        </View>
        <View style={styles.cartItemQuantitySelector}>
          <TouchableOpacity onPress={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)} style={styles.cartQuantityButton}>
            <Text style={styles.cartQuantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.cartQuantityValue}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.cartQuantityButton}>
            <Text style={styles.cartQuantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.shoppingCartPage}>
      {cartItems.length === 0 ? (
        <View style={styles.cartEmptyContainer}>
          <Text style={styles.cartEmptyText}>您的購物車是空的</Text>
        </View>
      ) : (
        <FlatList data={cartItems} renderItem={renderCartItem} keyExtractor={item => item.id} contentContainerStyle={styles.cartListContainer} />
      )}

      <View style={styles.checkoutButtonContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => alert('功能待開發！')}>
          <Text style={styles.checkoutButtonText}>去買單</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProductDetailScreen({route}) {
  const navigation = useNavigation();
  const {product} = route.params;
  const {width} = Dimensions.get('window');
  const {addToCart} = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);

  return (
    <View style={styles.productDetailContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.productInfoContainer}>
          <Image source={product.image} style={styles.productImageDetail} />
          <Text style={styles.productNameDetail}>{product.name}</Text>
          <Text style={styles.productOriginDetail}>{product.brand}</Text>

          <View style={styles.quantitySelector}>
            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.quantityButton}>
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.quantityButton}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(product, quantity)}>
            <Text style={styles.addToCartButtonText}>加入購物車</Text>
          </TouchableOpacity>

          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              "銀川 是我父親的名字, 我希望銀川能帶著父親的傳承, 帶著土地的傳承, 一直走下去。"
            </Text>
            <Text style={styles.quoteAuthor}>— 銀川有機米創辦人 劉兆霖</Text>
          </View>

          <View style={styles.purchaseContainer}>
            <Text style={styles.purchaseTitle}>|  哪裡可以購買  |</Text>
            <Text style={styles.purchaseLocation}>
              銀川有機米建立於1996年，農夫賴兆炫，沿用父親的名字 「銀川」 來命名，於花蓮擁有340公頃的有機農田與143位農友攜手合作。超過25年的有機耕種經驗，更曾獲得十大神農獎、十大有機農業貢獻單位獎等殊榮。並通過台灣有機驗證、美國USDA、歐盟EU、清真、ISO22000及HACCP雙驗證，是全台最大的有機農場。
            </Text>
            <Text style={styles.purchaseTitle}>|  純淨產地—台灣花蓮富里  |</Text>
            <Text style={styles.purchaseLocation}>
              銀川有機米主要種植於花蓮深土區域，這裡污染極低，日夜溫差大，水源來自麥飯石礦區，成微鹼性，每一粒米都是喝著這純淨泉水長大！粒粒飽滿香甜，擁有最好的品質。
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// === Stack for Explore ===
function ExploreStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExploreScreen" component={ExploreScreen} options={{headerShown: false}} />
      <Stack.Screen name="ShoppingCart" component={ShoppingCartScreen} options={{headerTitle: '購物車', headerBackTitleVisible: false}} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{headerShown: false, presentation: 'modal'}} />
    </Stack.Navigator>
  );
}

/** ===================== MainTabs（你原本的三個分頁） ===================== **/
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color}) => {
          let iconName; let IconComponent = null; let iconSize = 24;

          if (route.name === 'Home') {
            IconComponent = MaterialCommunityIcons;
            iconName = focused ? 'home' : 'home-outline';
            iconSize = 25;
          } else if (route.name === 'SpecialCenter') {
            IconComponent = MaterialCommunityIcons;
            iconName = focused ? 'cube' : 'cube-outline';
            iconSize = 38;
            return (
              <View style={styles.specialButtonContainer}>
                <IconComponent name={iconName} size={iconSize} color={focused ? '#fff' : '#000'} />
              </View>
            );
          } else if (route.name === 'Explore') {
            IconComponent = FontAwesome5;
            iconName = 'compass';
          }

          if (!IconComponent) return <View />;
          return <IconComponent name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#FC6E2A',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBarStyle,
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="SpecialCenter" component={SpecialCenterScreen} />
      <Tab.Screen name="Explore" component={ExploreStackScreen} />
    </Tab.Navigator>
  );
}

/** ===================== App Root：Auth + Main ===================== **/
export default function App() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      RNBootSplash.hide({ fade: true });
    });
    return () => task.cancel?.();
  }, []);

  return (
    <CartProvider>
      <View style={styles.appContainer}>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            {/* Auth flow */}
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <RootStack.Screen name="Verify" component={VerifyScreen} />
            <RootStack.Screen name="SignUp" component={SignUpScreen} />
            {/* 登入後的主程式 */}
            <RootStack.Screen name="Main" component={MainTabs} />
          </RootStack.Navigator>
        </NavigationContainer>
      </View>
    </CartProvider>
  );
}

// === Styles（你的原樣式） ===
const styles = StyleSheet.create({
  appContainer: {flex: 1, backgroundColor: 'white'},
  homeScreenContainer: {flex: 1, backgroundColor: '#fff'},
  tabBarStyle: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 70,
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    paddingTop: 10,
    paddingBottom: 20,
  },
  specialButtonContainer: {
    backgroundColor: '#FC6E2A',
    borderRadius: 99,
    width: 60, height: 60,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerTextBlock: {position: 'absolute', left: 30, top: 30, zIndex: 10},
  hualienTextInHome: {fontWeight: 'bold', fontSize: 20, color: '#FC6E2A'},
  subtitleTextInHome: {fontFamily: 'Arial', fontSize: 12, color: '#676767', marginTop: 2},
  topHorizontalLine: {position: 'absolute', left: 0, width: screenWidth, height: 2, top: 92, backgroundColor: '#F9F8F8', zIndex: 5},
  recipeButtonsContainer: {flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', top: 102, width: screenWidth - 30, left: 15, zIndex: 10},
  recipeButton1InHome: {width: (screenWidth - 40) / 2, height: 30, backgroundColor: '#FFFFFF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 50, justifyContent: 'center', alignItems: 'center'},
  recipeButtonText1: {color: '#000000', fontFamily: 'Arial', fontSize: 12},
  recipeButton2InHome: {width: (screenWidth - 40) / 2, height: 30, backgroundColor: '#FFFFFF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 50, justifyContent: 'center', alignItems: 'center'},
  recipeButtonText2: {color: '#000000', fontFamily: 'Arial', fontSize: 12},
  buttonUnderlineLeft: {position: 'absolute', left: 15, width: (screenWidth - 40) / 2, height: 5, top: 140, backgroundColor: '#B6B6B6', zIndex: 5},
  buttonUnderlineRight: {position: 'absolute', left: 15 + (screenWidth - 40) / 2 + 10, width: (screenWidth - 40) / 2, height: 5, top: 140, backgroundColor: '#B6B6B6', zIndex: 5},
  categoryNavigationWrapper1: {position: 'absolute', left: 0, width: screenWidth, top: 150},
  categoryNavigationWrapper2: {position: 'absolute', left: 0, width: screenWidth, top: 90},
  headerContainer: {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10},
  headerBg: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  recipeList: {flex: 1},
  recipeListContent: {paddingBottom: 90, paddingHorizontal: 15},
  recipeCard: {
    flexDirection: 'row', backgroundColor: '#FFD8C0', borderRadius: 50, marginVertical: 10,
    shadowColor: '#000', shadowOffset: {width: 5, height: 5}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, overflow: 'hidden',
    width: screenWidth - 30,
  },
  recipeTextContent: {flex: 8, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 25},
  recipeTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5},
  recipeTitle: {fontWeight: 'bold', fontSize: 18, color: '#FC6E2A'},
  recipeDescription: {fontWeight: 'bold', fontSize: 12, color: '#000000b6', marginBottom: 10},
  recipeIngredientsTitle: {fontFamily: 'Sen-Bold', fontSize: 10, color: '#555', marginBottom: 2},
  recipeIngredients: {fontFamily: 'Arial', fontSize: 9, color: '#888', lineHeight: 14},
  recipeImage: {flex: 1, width: '100%', height: '100%', resizeMode: 'cover', minWidth: 100},

  // Explore
  shoppingCartButton: {left: 320, top: 30, width: 50, height: 50, borderRadius: 50, backgroundColor: '#E6E6E6', justifyContent: 'center', alignItems: 'center'},
  productListHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 10},
  productListTitle: {fontWeight: 'bold', fontSize: 20, color: '#32343E', left: 10, top: 125},
  seeAllText: {fontFamily: 'Arial', fontSize: 16, color: '#333333', left: 8, top: 125},
  productList: {marginTop: 130, flex: 1, paddingHorizontal: 15},
  productListContent: {paddingBottom: 90},
  row: {justifyContent: 'space-between'},
  productCard: {backgroundColor: '#F6F6F6', borderRadius: 20, width: screenWidth / 2 - 34, height: 230, marginVertical: 8, marginHorizontal: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, overflow: 'hidden'},
  productImage: {width: '100%', height: 165, resizeMode: 'cover', borderTopLeftRadius: 10, borderTopRightRadius: 10},
  productInfo: {padding: 10},
  productName: {fontWeight: 'bold', fontSize: 15, color: '#333', marginBottom: 3},
  productBrand: {fontFamily: 'Arial', fontSize: 12, color: '#666'},

  // ScrollView 分類列
  catStripContent: { paddingHorizontal: 16, paddingVertical: 10 },
  catAll: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center', marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#EFEFEF', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 28, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  catChipActive: { backgroundColor: '#FFF2E8', borderColor: '#FFC9A3', shadowOpacity: 0.12, elevation: 3 },
  catText: { fontSize: 14, color: '#333', fontWeight: '600' },
  catTextActive: { color: '#FC6E2A' },
  catImgWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF7EF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  catImgWrapActive: { backgroundColor: '#FFDCC6' },
  catImg: { width: 40, height: 40, resizeMode: 'contain', borderRadius: 100 },

  // 購物車
  shoppingCartPage: {flex: 1, backgroundColor: '#fff'},
  cartListContainer: {paddingHorizontal: 15, paddingTop: 20, paddingBottom: 100},
  cartItemContainer: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, marginBottom: 10},
  cartItemImage: {width: 60, height: 60, borderRadius: 8, marginHorizontal: 10},
  cartItemInfo: {flex: 1},
  cartItemName: {fontSize: 16, fontFamily: 'Sen-Bold'},
  cartItemBrand: {fontSize: 12, color: 'gray', fontFamily: 'Arial'},
  cartItemQuantitySelector: {flexDirection: 'row', alignItems: 'center'},
  cartQuantityButton: {width: 30, height: 30, backgroundColor: '#e0e0e0', borderRadius: 15, justifyContent: 'center', alignItems: 'center'},
  cartQuantityButtonText: {fontSize: 18, fontWeight: 'bold', color: '#333'},
  cartQuantityValue: {fontSize: 16, fontWeight: 'bold', marginHorizontal: 10},
  cartEmptyContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  cartEmptyText: {fontSize: 18, color: 'gray', fontFamily: 'Arial'},
  checkoutButtonContainer: {position: 'absolute', bottom: 10, right: 15, padding: 10},
  checkoutButton: {backgroundColor: '#FC6E2A', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5},
  checkoutButtonText: {color: '#fff', fontSize: 16, fontFamily: 'Sen-Bold'},

  // 聊天
  specialCenterScreenContainer: {flex: 1, backgroundColor: '#f5f5f5'},
  chatHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 70, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'},
  headerTitleContainer: {position: 'absolute', left: 87, top: 48, zIndex: 10},
  headerPlaceholder: {width: 24},
  messageList: {paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100},
  messageContainer: {padding: 15, borderRadius: 15, marginVertical: 10, maxWidth: '80%', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2},
  userMessageContainer: {backgroundColor: '#FC6E2A', alignSelf: 'flex-end'},
  aiMessageContainer: {backgroundColor: '#fff', alignSelf: 'flex-start'},
  messageText: {fontFamily: 'Arial', fontSize: 15, color: 'black'},
  inputContainer: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#eee'},
  inputLeftIcon: {marginRight: 10},
  textInput: {flex: 1, backgroundColor: '#f0f0f0', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, fontFamily: 'Arial', fontSize: 16, maxHeight: 120},

  // 商品詳情
  productDetailContainer: {flex: 1, backgroundColor: '#fff'},
  header: {paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff',
    borderTopLeftRadius: 30, borderTopRightRadius: 30, zIndex: 1, shadowColor: '#000', shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5},
  backButton: {padding: 5},
  scrollContent: {paddingBottom: 110, paddingHorizontal: 20, backgroundColor: '#fff'},
  productInfoContainer: {alignItems: 'center', marginTop: -20},
  productImageDetail: {width: screenWidth * 0.7, height: screenWidth * 0.7, resizeMode: 'contain', marginTop: 30, borderRadius: 10, marginBottom: 10},
  productNameDetail: {fontSize: 24, fontWeight: 'bold', marginBottom: 10},
  productOriginDetail: {fontSize: 16, color: 'gray'},
  quoteContainer: {marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, alignSelf: 'stretch'},
  quoteText: {fontStyle: 'italic', color: '#555'},
  quoteAuthor: {textAlign: 'right', marginTop: 10, color: '#888'},
  purchaseContainer: {marginTop: 30, alignSelf: 'stretch'},
  purchaseTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 30, marginLeft: 5, marginBottom: 30},
  purchaseLocation: {fontSize: 16, marginTop: 5, color: '#666', marginBottom: 50},
  addToCartButton: { backgroundColor: '#FC6E2A', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 50 },
  addToCartButtonText: { color: '#fff', fontFamily: 'Sen-Bold', fontSize: 15 },

  quantitySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
  quantityButton: { width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  quantityValue: { fontSize: 22, fontWeight: 'bold', marginHorizontal: 20 },
});
123