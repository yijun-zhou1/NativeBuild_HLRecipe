// src/auth/AuthScreens.js
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const COLORS = {
  bgDark: '#0F1320',
  white: '#FFFFFF',
  field: '#EEF3F8',
  text: '#333333',
  sub: '#8A8F9A',
  primary: '#FC6E2A',
  border: '#E9EDF3',
};

const DarkHeader = ({ title, subtitle, showBack, onBack }) => (
  <View style={styles.header}>
    {showBack ? (
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={20} color={COLORS.text} />
      </TouchableOpacity>
    ) : null}
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
  </View>
);

/** -------------------- Login -------------------- */
export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);

  const goMain = () => {
    // 這裡直接導到 Main（把 Main 換成你的 Tab/Stack 名稱）
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollBody} bounces={false}>
        <DarkHeader title="Log In" subtitle="Please sign in to your existing account" />

        <View style={styles.sheet}>
          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="example@gmail.com"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="• • • • • • • • •"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={pwd}
              onChangeText={setPwd}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color="#88939E" />
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.row} onPress={() => setRemember(r => !r)}>
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember ? <Ionicons name="checkmark" size={14} color={COLORS.white} /> : null}
              </View>
              <Text style={styles.remember}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Forgot Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={goMain} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>LOG IN</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={styles.subtle}>
              Don’t have an account?{' '}
              <Text style={styles.emLink} onPress={() => navigation.navigate('SignUp')}>
                SIGN UP
              </Text>
            </Text>
          </View>

          <Text style={[styles.subtle, { textAlign: 'center', marginTop: 18 }]}>Or</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#3b5998' }]}>
              <FontAwesome5 name="facebook-f" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1DA1F2' }]}>
              <FontAwesome5 name="twitter" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#0D0D0D' }]}>
              <FontAwesome5 name="apple" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/** -------------------- Forgot Password -------------------- */
export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollBody} bounces={false}>
        <DarkHeader
          title="Forgot Password"
          subtitle="Please sign in to your existing account"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={styles.sheet}>
          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="example@gmail.com"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 20 }]}
            onPress={() => navigation.navigate('Verify')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>SEND CODE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/** -------------------- Verification (OTP) -------------------- */
export const VerifyScreen = ({ navigation, route }) => {
  const inputs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [code, setCode] = useState(['', '', '', '']);
  const [sec, setSec] = useState(50);

  useEffect(() => {
    const t = setInterval(() => setSec(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (v, i) => {
    const newCode = [...code];
    newCode[i] = v.replace(/[^0-9]/g, '').slice(0, 1);
    setCode(newCode);
    if (newCode[i] && i < 3) inputs[i + 1].current?.focus();
  };

  const verify = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollBody} bounces={false}>
        <DarkHeader
          title="Verification"
          subtitle="We have sent a code to your email"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={styles.sheet}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>CODE</Text>
            <Text style={styles.subtle}>
              Resend {sec > 0 ? `in ${sec}sec` : ''}
            </Text>
          </View>

          <View style={styles.otpRow}>
            {code.map((c, i) => (
              <TextInput
                key={i}
                ref={inputs[i]}
                style={styles.otpBox}
                value={c}
                onChangeText={v => handleChange(v, i)}
                keyboardType="number-pad"
                returnKeyType="next"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={verify} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>VERIFY</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/** -------------------- Sign Up -------------------- */
export const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const submit = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollBody} bounces={false}>
        <DarkHeader title="Sign Up" subtitle="Please sign up to get started" showBack onBack={() => navigation.goBack()} />

        <View style={styles.sheet}>
          <Text style={styles.label}>NAME</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="John doe"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>EMAIL</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="example@gmail.com"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="• • • • • • • • •"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={pwd}
              onChangeText={setPwd}
              secureTextEntry={!show1}
            />
            <TouchableOpacity onPress={() => setShow1(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={show1 ? 'eye-off' : 'eye'} size={18} color="#88939E" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>RE-TYPE PASSWORD</Text>
          <View style={styles.fieldWrap}>
            <TextInput
              placeholder="• • • • • • • • •"
              placeholderTextColor="#A7B0BC"
              style={styles.input}
              value={pwd2}
              onChangeText={setPwd2}
              secureTextEntry={!show2}
            />
            <TouchableOpacity onPress={() => setShow2(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={show2 ? 'eye-off' : 'eye'} size={18} color="#88939E" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={submit} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  scrollBody: { paddingBottom: 40 },
  header: {
    backgroundColor: COLORS.bgDark,
    paddingTop: 54,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerTitle: { color: COLORS.white, fontWeight: '700', fontSize: 26, marginBottom: 6 },
  headerSubtitle: { color: '#D2D6DD', fontSize: 13 },

  sheet: { paddingHorizontal: 20, paddingTop: 40 },
  label: { fontSize: 12, color: COLORS.sub, marginBottom: 8, fontWeight: '600' },
  fieldWrap: {
    backgroundColor: COLORS.field, borderRadius: 12, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
  },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  eyeBtn: { paddingHorizontal: 6, paddingVertical: 8 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },

  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#C8D0DA',
    alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: COLORS.white,
  },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  remember: { color: COLORS.sub, fontSize: 13 },

  link: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    marginTop: 18, height: 52, borderRadius: 12, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

  subtle: { color: COLORS.sub, fontSize: 13 },
  emLink: { color: COLORS.primary, fontWeight: '700' },

  socialRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', gap: 18 },
  socialBtn: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  otpBox: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: COLORS.field, borderWidth: 1, borderColor: COLORS.border,
    fontSize: 20, color: COLORS.text,
  },
});
