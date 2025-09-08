// src/App.js
import 'react-native-gesture-handler';
import React, {useState, useContext, useEffect, useRef} from 'react';
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
  Modal,
  ActivityIndicator,
  Pressable,
} from 'react-native';

import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

import AsyncStorage from '@react-native-async-storage/async-storage'; // ← 新增

import {CartProvider, CartContext} from './context/CartContext';
import RNBootSplash from 'react-native-bootsplash';
import { BlurView } from '@react-native-community/blur';

// 🔐 Auth flow（你已有）
import { LoginScreen, ForgotPasswordScreen, VerifyScreen, SignUpScreen } from './auth/AuthScreens';

// ======= 你的 Google 試算表（CSV） =======
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTCKhNS58hvoVKgYAbxURlrGp08qlXvp3Z-8Nb8j0E--wqCGuaXG1DXqaXtRIsJe-VvsIn2WplgV7LT/pub?output=csv';

// 螢幕寬度
const screenWidth = Dimensions.get('window').width;

// Tab / Stack
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator();

// 農產品（Explore）使用的 Google 試算表（請用 CSV 輸出）
const PRODUCTS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT06UBF-WPWNW8pZ6_8XkeZRMsibFYoXMD5AeeJCZQbZAZWTHpzm71vaRn4igT-V_0kB4Y73snXV-rh/pub?output=csv';

// 地圖查詢彈窗要顯示的圖片（把你的地圖圖存到 assets/static_map.png）
const MAP_IMAGE = require('../assets/static_map/hualien_map.png');

/** =========================
 *  小型 CSV 解析器
 *  ========================= */
function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && next === '\n') i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter(r => r.length > 0);
}

/** =========================
 *  免責聲明 Modal（新增）
 *  ========================= */
const DisclaimerModal = ({visible, onAgree, onDecline}) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!visible) setChecked(false);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.disclaimerBackdrop}>
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>免責聲明</Text>

          <ScrollView
            style={styles.disclaimerBody}
            contentContainerStyle={{paddingBottom: 8}}
            showsVerticalScrollIndicator>
            <Text style={styles.disclaimerParagraph}>
              使用「花蓮好食智慧聊」即表示你了解並同意：本 app 之食譜、營養與烹飪建議僅供參考，非醫療或專業意見；實作料理請自行評估風險並注意廚房安全。若有過敏、特殊飲食或健康問題，請先諮詢專業人員。
            </Text>
            <Text style={styles.disclaimerParagraph}>
              平台整合之在地小農商品資訊、價格與庫存可能隨時變動，實際出貨、品質、售後與退換貨由各商家自行負責；本平台不承擔因此產生之損失或糾紛。
            </Text>
            <Text style={styles.disclaimerParagraph}>
              AI 聊天回覆可能不完整或有誤，僅供參考，請自行判斷使用。圖片多為示意，實品以商家資訊為準。繼續使用即代表你同意本服務條款與隱私權政策。
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.disclaimerCheckRow}
            onPress={() => setChecked(v => !v)}
            activeOpacity={0.85}>
            <View style={[styles.disclaimerCheckbox, checked && styles.disclaimerCheckboxOn]}>
              {checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </View>
            <Text style={styles.disclaimerCheckText}>我已閱讀並同意</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!checked}
            onPress={onAgree}
            activeOpacity={0.9}
            style={[styles.disclaimerPrimaryBtn, !checked && {opacity: 0.5}]}>
            <Text style={styles.disclaimerPrimaryText}>同意並繼續</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDecline} style={styles.disclaimerGhostBtn} activeOpacity={0.7}>
            <Text style={styles.disclaimerGhostText}>不同意，返回登入</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// === Demo（Explore / 購物） ===
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

/* ===================== 首頁（抓 Google 試算表） ===================== */
function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('all');

  // Header 動畫
  const HEADER_HEIGHT = 218;
  const scrollY = useRef(new Animated.Value(0)).current;
  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 40, 120],
    outputRange: [1, 0.85, 1.5],
    extrapolate: 'clamp',
  });

  // 來自 Google Sheets 的資料
  const [recipes, setRecipes] = useState([]);   // { id, title, intro, ingredients, steps, imageUrl, category }
  const [loading, setLoading] = useState(true);
  const [sheetErr, setSheetErr] = useState('');

  // 詳細面板
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // 抓表
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CSV_URL);
        const text = await res.text();
        const rows = parseCSV(text);
        if (!rows.length) throw new Error('空白 CSV');

        const header = rows[0].map(h => (h || '').trim());
        const idx = nameList => header.findIndex(h => nameList.some(n => h === n || h.toLowerCase() === n.toLowerCase()));

        const colTitle = idx(['料理名稱','菜名','title','名稱']);
        const colIntro = idx(['描述','一句話介紹','介紹','intro','description']);
        const colIng   = idx(['材料','食材','ingredients']);
        const colSteps = idx(['料理步驟','步驟','作法','做法','steps']);
        const colCat   = idx(['分類','類別','category']);
        const colImg   = idx(['圖片URL','圖片','圖片連結','image','imageurl']);

        const data = rows.slice(1)
          .filter(r => r.some(c => (c || '').trim() !== ''))
          .map((r, i) => ({
            id: String(i + 1),
            title: (r[colTitle] || '').trim(),
            intro: (r[colIntro] || '').trim(),
            ingredients: (r[colIng] || '').trim(),
            steps: (r[colSteps] || '').trim(),
            category: (r[colCat] || 'all').trim(),
            imageUrl: (r[colImg] || '').trim(),
          }))
          .filter(it => it.title);

        setRecipes(data);
        setSheetErr('');
      } catch (e) {
        setSheetErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openDetail = (item) => {
    setSelectedRecipe(item);
    setDetailOpen(true);
  };

  const renderRecipeItem = ({item}) => (
    <TouchableOpacity style={styles.recipeCard} onPress={() => openDetail(item)} activeOpacity={0.85}>
      <View style={styles.recipeTextContent}>
        <View style={styles.recipeTitleRow}>
          <Text style={styles.recipeTitle} numberOfLines={1}>
            {item.title || '未命名食譜'}
          </Text>
          <MaterialCommunityIcons name="bookmark-outline" size={20} color="#777" />
        </View>

        {!!item.intro && (
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.intro}
          </Text>
        )}

        {!!item.ingredients && (
          <>
            <Text style={styles.recipeIngredientsTitle}>所需食材：</Text>
            <Text style={styles.recipeIngredients} numberOfLines={2} ellipsizeMode="tail">
              {item.ingredients}
            </Text>
          </>
        )}
      </View>

      <View style={styles.recipeImageBox}>
        {item.imageUrl ? (
          <Image source={{uri: item.imageUrl}} style={styles.recipeImageReal} />
        ) : (
          <View style={styles.recipeImagePlaceholder} />
        )}
      </View>
    </TouchableOpacity>
  );

  const listData = recipes;

  return (
    <View style={styles.homeScreenContainer}>
      {loading ? (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <ActivityIndicator size="large" color="#FC6E2A" />
          <Text style={{marginTop:8, color:'#888'}}>載入食譜中…</Text>
          {!!sheetErr && <Text style={{marginTop:8, color:'#d33'}}>錯誤：{sheetErr}</Text>}
        </View>
      ) : (
        <Animated.FlatList
          data={listData}
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
      )}

      <View style={[styles.headerContainer, {height: HEADER_HEIGHT}]}>
        <Animated.View style={[styles.headerBg, { opacity: bgOpacity }]}>
          <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={12} reducedTransparencyFallbackColor="white" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
        </Animated.View>

        <View style={styles.headerTextBlock}>
          <Text style={styles.hualienTextInHome}>花蓮好食智慧聊</Text>
          <Text style={styles.subtitleTextInHome}>今天來煮點什麼呢！</Text>
        </View>

        <View style={styles.topHorizontalLine} />

        <View style={styles.recipeButtonsContainer}>
          <TouchableOpacity style={styles.recipeButton1InHome} activeOpacity={0.7}>
            <Text style={styles.recipeButtonText1}>推薦食譜</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.recipeButton2InHome} activeOpacity={0.7}>
            <Text style={styles.recipeButtonText2}>已收藏食譜</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonUnderlineLeft} />
        <View style={styles.buttonUnderlineRight} />

        <View style={styles.categoryNavigationWrapper1}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catStripContent}>
            {categories1.map(category => {
              const isActive = activeCategory === category.id;
              const base = (
                <Text style={[styles.catText, isActive && styles.catTextActive]}>{category.name}</Text>
              );

              if (category.id === 'all') {
                return (
                  <TouchableOpacity key={category.id} activeOpacity={0.85} onPress={() => setActiveCategory(category.id)}>
                    <View style={[styles.catAll, isActive && styles.catChipActive]}>{base}</View>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={category.id} activeOpacity={0.85} onPress={() => setActiveCategory(category.id)} style={[styles.catChip, isActive && styles.catChipActive]}>
                  {category.image && (
                    <View style={[styles.catImgWrap, isActive && styles.catImgWrapActive]}>
                      <Image source={category.image} style={styles.catImg} />
                    </View>
                  )}
                  {base}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 詳細面板（底部白卡） */}
      <Modal
        animationType="fade"
        transparent
        visible={detailOpen}
        onRequestClose={() => setDetailOpen(false)}
      >
        <Pressable style={styles.sheetMask} onPress={() => setDetailOpen(false)} />
        <View style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={{paddingBottom: 40}}>
            <View style={styles.sheetHeroBox}>
              {selectedRecipe?.imageUrl ? (
                <Image source={{uri: selectedRecipe.imageUrl}} style={styles.sheetHeroImg} />
              ) : (
                <View style={styles.sheetHeroPlaceholder} />
              )}
            </View>

            <View style={{paddingHorizontal: 18, paddingTop: 14, paddingBottom:20}}>
              <Text style={styles.sheetTitle}>{selectedRecipe?.title || ''}</Text>

              {!!selectedRecipe?.ingredients && (
                <Text style={styles.sheetSub}>
                  所需食材：<Text style={{color:'#333'}}>{selectedRecipe.ingredients}</Text>
                </Text>
              )}

              {!!selectedRecipe?.steps && (
                <>
                  <Text style={styles.sheetStepsLabel}>步驟：</Text>
                  <Text style={styles.sheetStepsText}>{selectedRecipe.steps}</Text>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <StatusBar barStyle="dark-content" />
    </View>
  );
}

/* ===================== 聊天頁 ===================== */
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

/* ===================== Explore + Stack ===================== */
function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { addToCart } = useContext(CartContext);
  const navigation = useNavigation();

  // 從 Google 試算表抓的商品
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // 地圖查詢彈窗
  const [mapVisible, setMapVisible] = useState(false);

  // 將試算表「分類」文字對映到你現有 chips 的 id
  const mapCategoryTextToId = (txt = '') => {
    if (/稻|米|雜糧/.test(txt)) return 'rice';
    if (/蔬菜/.test(txt)) return 'noodle';
    if (/水果/.test(txt)) return 'soup';
    if (/加工|特色/.test(txt)) return 'dessert';
    if (/花卉/.test(txt)) return 'drink';
    return 'drink2';
  };

  // 讀取 Google CSV（欄位：id、產品名稱、分類、產品介紹、去哪裡購買、產品圖片、產地、小農故事）
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(PRODUCTS_CSV_URL);
        const text = await res.text();
        const rows = parseCSV(text);
        if (!rows.length) throw new Error('空白 CSV');

        // 去空白/符號的小工具，讓比對更寬鬆
        const norm = s =>
          (s || '')
            .toLowerCase()
            .replace(/\s|　/g, '')       // 所有半/全形空白
            .replace(/[^\p{L}\p{N}]+/gu, ''); // 去掉非文字與數字

        const headerRaw = rows[0].map(h => (h || '').trim());
        const header = headerRaw.map(norm);

        const findCol = (candidates) => {
          const cands = candidates.map(norm);
          let idx = header.findIndex(h =>
            cands.includes(h) || cands.some(c => h.includes(c) || c.includes(h))
          );
          return idx; // -1 代表沒找到
        };

        // 常見同義字都列進來
        const cId     = findCol(['id','編號','項次']);
        const cName   = findCol(['產品名稱','品名','名稱','title','name']);
        const cCat    = findCol(['分類','類別','category']);
        const cIntro  = findCol(['產品介紹','介紹','說明','描述','intro','description']);
        const cBuy    = findCol([
          '去哪裡購買','哪裡可以購買','在哪裡購買','購買資訊','購買連結','購買地點',
          '販售通路','販售地點','銷售據點','where to buy','buy','購買'
        ]);
        const cImg    = findCol(['產品圖片','圖片url','圖片','image','imageurl','image link']);
        const cOrigin = findCol(['產地','來源','產區','origin']);
        const cStory  = findCol(['小農故事','品牌故事','故事','story']);

        const data = rows.slice(1)
          .filter(r => r.some(c => (c || '').trim() !== ''))
          .map((r, i) => {
            const get = (idx) => (idx >= 0 ? (r[idx] || '').trim() : '');

            const catText = get(cCat);
            return {
              id: get(cId) || String(i + 1),
              name: get(cName),
              category: mapCategoryTextToId(catText),
              categoryText: catText,
              intro: get(cIntro),
              whereToBuy: get(cBuy),
              imageUrl: get(cImg),
              origin: get(cOrigin),
              story: get(cStory),
            };
          })
          .filter(p => p.name);

        setProducts(data);
        setErr('');
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory);

  const renderProductItem = ({ item }) => {
    const imageSource = item.imageUrl ? { uri: item.imageUrl } : null;
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.8}
      >
        {imageSource ? (
          <Image source={imageSource} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={styles.productBrand} numberOfLines={1} ellipsizeMode="tail">
            {item.origin || '—'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleShoppingCartPress = () => navigation.navigate('ShoppingCart');

  return (
    <View style={styles.homeScreenContainer}>
      {/* 標題 */}
      <View style={styles.headerTextBlock}>
        <Text style={styles.hualienTextInHome}>花蓮在地有機農產品</Text>
        <Text style={styles.subtitleTextInHome}>原來花蓮有這麼多在地小農</Text>
      </View>

      {/* 購物車 */}
      <TouchableOpacity style={styles.shoppingCartButton} onPress={handleShoppingCartPress}>
        <Ionicons name="cart-outline" size={30} color="black" />
      </TouchableOpacity>

      {/* 分類列（維持你的 UI） */}
      <View style={styles.categoryNavigationWrapper2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catStripContent}>
          {categories2.map(category => {
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
                <Text style={[styles.catText, isActive && styles.catTextActive]}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 標題列右側「地圖查詢」 */}
      <View style={styles.productListHeader}>
        <Text style={styles.productListTitle}>產品品牌</Text>
        <TouchableOpacity onPress={() => setMapVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.mapSearchText}>地圖查詢</Text>
        </TouchableOpacity>
      </View>

      {/* 列表 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FC6E2A" />
          {!!err && <Text style={{ marginTop: 8, color: '#d33' }}>{err}</Text>}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productListContent}
          style={styles.productList}
        />
      )}

      {/* 地圖彈窗 */}
      <Modal visible={mapVisible} transparent animationType="fade" onRequestClose={() => setMapVisible(false)}>
        <Pressable style={styles.mapMask} onPress={() => setMapVisible(false)} />
        <View style={styles.mapCard}>
          <Image source={MAP_IMAGE} style={styles.mapImg} />
        </View>
      </Modal>

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

function ProductDetailScreen({ route }) {
  const navigation = useNavigation();
  const { product } = route.params;
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);

  const imageSource =
    product?.image ? product.image :
    product?.imageUrl ? { uri: product.imageUrl } : null;

  const origin = product?.brand || product?.origin || '';
  const whereToBuy = product?.whereToBuy || '';
  const story = product?.story || '';

  return (
    <View style={styles.productDetailContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.productInfoContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.productImageDetail} />
          ) : (
            <View style={[styles.productImageDetail, { backgroundColor: '#eee' }]} />
          )}

          <Text style={styles.productNameDetail}>{product?.name || ''}</Text>
          <Text style={styles.productOriginDetail}>{origin}</Text>

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

          {/* 產品介紹 */}
          {!!product?.intro && (
            <View style={styles.purchaseContainer}>
              <Text style={styles.purchaseTitle}>|  產品介紹  |</Text>
              <Text style={styles.purchaseLocation}>{product.intro}</Text>
            </View>
          )}

          {/* 去哪裡購買 */}
          {!!whereToBuy && (
            <View style={styles.purchaseContainer}>
              <Text style={styles.purchaseTitle}>|  哪裡可以購買  |</Text>
              <Text style={styles.purchaseLocation}>{whereToBuy}</Text>
            </View>
          )}

          {/* 產地 */}
          {!!origin && (
            <View style={styles.purchaseContainer}>
              <Text style={styles.purchaseTitle}>|  純淨產地  |</Text>
              <Text style={styles.purchaseLocation}>{origin}</Text>
            </View>
          )}

          {/* 小農故事 */}
          {!!story && (
            <View style={styles.purchaseContainer}>
              <Text style={styles.purchaseTitle}>|  小農故事  |</Text>
              <Text style={styles.purchaseLocation}>{story}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ExploreStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExploreScreen" component={ExploreScreen} options={{headerShown: false}} />
      <Stack.Screen name="ShoppingCart" component={ShoppingCartScreen} options={{headerTitle: '購物車', headerBackTitleVisible: false}} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{headerShown: false, presentation: 'modal'}} />
    </Stack.Navigator>
  );
}

/* ===================== MainTabs ===================== */
function MainTabs() {
  const navigation = useNavigation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const flag = await AsyncStorage.getItem('disclaimerAccepted_v1');
        if (flag !== '1') setShowDisclaimer(true);
      } catch {}
    })();
  }, []);

  const handleAgree = async () => {
    await AsyncStorage.setItem('disclaimerAccepted_v1', '1');
    setShowDisclaimer(false);
  };

  const handleDecline = async () => {
    await AsyncStorage.removeItem('disclaimerAccepted_v1');
    // 回登入頁
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  };

  return (
    <>
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

      {/* 免責聲明（第一次登入顯示） */}
      <DisclaimerModal
        visible={showDisclaimer}
        onAgree={handleAgree}
        onDecline={handleDecline}
      />
    </>
  );
}

/* ===================== App Root ===================== */
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
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <RootStack.Screen name="Verify" component={VerifyScreen} />
            <RootStack.Screen name="SignUp" component={SignUpScreen} />
            <RootStack.Screen name="Main" component={MainTabs} />
          </RootStack.Navigator>
        </NavigationContainer>
      </View>
    </CartProvider>
  );
}

/* ===================== Styles ===================== */
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

  headerContainer: {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10},
  headerBg: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},

  recipeList: {flex: 1, paddingTop: 10},
  recipeListContent: {paddingBottom: 90, paddingHorizontal: 15},

  // 卡片
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFD8C0',
    borderRadius: 30,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 5, height: 5},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
    width: screenWidth - 30,
    minHeight: 110,
  },
  recipeTextContent: {flex: 8, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 18},
  recipeTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5},
  recipeTitle: {fontWeight: 'bold', fontSize: 18, color: '#FC6E2A'},
  recipeDescription: {fontWeight: 'bold', fontSize: 12, color: '#000000b6', marginBottom: 8},
  recipeIngredientsTitle: {fontFamily: 'Sen-Bold', fontSize: 10, color: '#555', marginBottom: 2},
  recipeIngredients: {fontFamily: 'Arial', fontSize: 11, color: '#333', lineHeight: 16},

  recipeImageBox: {flex: 1, minWidth: 100},
  recipeImagePlaceholder: {flex: 1, backgroundColor: '#ffe8d9'},
  recipeImageReal: {flex: 1, width: '100%', height: '100%', resizeMode: 'cover'},

  // Explore（原樣）
  categoryNavigationWrapper2: {position: 'absolute', left: 0, width: screenWidth, top: 90},
  shoppingCartButton: {left: 320, top: 30, width: 50, height: 50, borderRadius: 50, backgroundColor: '#E6E6E6', justifyContent: 'center', alignItems: 'center'},
  productListHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 10},
  productListTitle: {fontWeight: 'bold', fontSize: 20, color: '#32343E', left: 10, top: 125},
  mapSearchText: {fontFamily: 'Arial', fontSize: 16, color: '#333333', left: -5, top: 125},
  productList: {marginTop: 130, flex: 1, paddingHorizontal: 15},
  productListContent: {paddingBottom: 90},
  row: {justifyContent: 'space-between'},
  productCard: {backgroundColor: '#F6F6F6', borderRadius: 20, width: screenWidth / 2 - 34, height: 230, marginVertical: 8, marginHorizontal: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, overflow: 'hidden'},
  productImage: {width: '100%', height: 165, resizeMode: 'cover', borderTopLeftRadius: 10, borderTopRightRadius: 10},
  productInfo: { padding: 10, minHeight: 58, justifyContent: 'space-between' },
  productName: {fontWeight: 'bold', fontSize: 15, color: '#333', marginBottom: 3},
  productBrand: {fontFamily: 'Arial', fontSize: 12, color: '#666'},

  // 分類橫條
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

  // ====== 底部白色面板 ======
  sheetMask: {flex:1, backgroundColor:'rgba(0,0,0,0.45)'},
  sheetContainer: {
    position:'absolute', left:0, right:0, bottom:0,
    backgroundColor:'#fff',
    borderTopLeftRadius:24, borderTopRightRadius:24,
    maxHeight:'86%',
    shadowColor:'#000', shadowOffset:{width:0, height:-2}, shadowOpacity:0.15, shadowRadius:8, elevation:10,
  },
  sheetHeroBox: {width:'100%', height: 240, backgroundColor:'#eee', borderTopLeftRadius:24, borderTopRightRadius:24, overflow:'hidden'},
  sheetHeroImg: {width:'100%', height:'100%', resizeMode:'cover'},
  sheetHeroPlaceholder: {flex:1, backgroundColor:'#f6f6f6'},
  sheetTitle: {fontSize: 24, fontWeight:'800', color:'#FC6E2A',marginTop:20 ,marginBottom: 20},
  sheetSub: {fontSize: 14, color:'#666', marginBottom: 12},
  sheetStepsLabel: {fontSize: 16, color:'#111', fontWeight:'700', marginTop: 25, marginBottom: 15},
  sheetStepsText: {fontSize: 15, lineHeight: 22, color:'#333'},

  // ====== 免責聲明樣式 ======
  disclaimerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  disclaimerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  disclaimerTitle: {fontSize: 20, fontWeight: '800', color: '#FC6E2A', marginBottom: 10},
  disclaimerBody: {maxHeight: 260},
  disclaimerParagraph: {fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 10},
  disclaimerCheckRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  disclaimerCheckbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.4, borderColor: '#C9CFD8',
    alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: '#fff',
  },
  disclaimerCheckboxOn: {backgroundColor: '#FC6E2A', borderColor: '#FC6E2A'},
  disclaimerCheckText: {fontSize: 14, color: '#333'},
  disclaimerPrimaryBtn: {
    marginTop: 14, height: 48, borderRadius: 12, backgroundColor: '#FC6E2A',
    alignItems: 'center', justifyContent: 'center',
  },
  disclaimerPrimaryText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  disclaimerGhostBtn: {alignSelf: 'center', paddingVertical: 10},
  disclaimerGhostText: {color: '#666', fontSize: 14, textDecorationLine: 'underline'},
   // ---- 地圖查詢 Modal ----
   mapMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
   mapCard: {
     position: 'absolute', left: 16, right: 16, top: 80, bottom: 80,
     backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
   },
   mapImg: { width: '100%', height: '100%', resizeMode: 'cover' },
});

