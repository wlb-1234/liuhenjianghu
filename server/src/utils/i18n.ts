// 多语言支持 - 国际化配置文件
export interface LocaleConfig {
  code: string;      // 语言代码: zh, en, ja, ko
  name: string;      // 显示名称: 中文, English, 日本語, 한국어
  native: string;    // 本地名称
  flag: string;      // 国旗emoji
}

// 支持的语言列表
export const supportedLocales: LocaleConfig[] = [
  { code: 'zh', name: '简体中文', native: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', native: '한국어', flag: '🇰🇷' },
];

// 默认语言
export const defaultLocale = 'zh';

// 翻译键值对
interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<string, Translations> = {
  // 中文
  zh: {
    app: {
      name: '流痕江湖',
      slogan: '人海为江湖，留言皆流痕',
      version: 'v1.0',
    },
    common: {
      confirm: '确定',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      submit: '提交',
      loading: '加载中...',
      noData: '暂无数据',
      success: '操作成功',
      error: '操作失败',
    },
    auth: {
      login: '登录',
      logout: '退出登录',
      register: '注册',
      phone: '手机号',
      code: '验证码',
      sendCode: '发送验证码',
    },
    content: {
      publish: '发布',
      recall: '撤回',
      featured: '加精',
      pinned: '置顶',
      comment: '评论',
      like: '点赞',
      share: '分享',
    },
    follow: {
      follow: '关注',
      following: '已关注',
      mutual: '互相关注',
      followers: '粉丝',
    },
    settings: {
      title: '设置',
      profile: '个人资料',
      privacy: '隐私设置',
      about: '关于',
    },
  },
  // 英文
  en: {
    app: {
      name: 'LiuHen Jianghu',
      slogan: 'Every trace tells a story',
      version: 'v1.0',
    },
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      submit: 'Submit',
      loading: 'Loading...',
      noData: 'No data',
      success: 'Success',
      error: 'Error',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      phone: 'Phone',
      code: 'Code',
      sendCode: 'Send Code',
    },
    content: {
      publish: 'Publish',
      recall: 'Recall',
      featured: 'Feature',
      pinned: 'Pin',
      comment: 'Comment',
      like: 'Like',
      share: 'Share',
    },
    follow: {
      follow: 'Follow',
      following: 'Following',
      mutual: 'Mutual',
      followers: 'Followers',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      privacy: 'Privacy',
      about: 'About',
    },
  },
  // 日文
  ja: {
    app: {
      name: '流痕江湖',
      slogan: '人の海が江湖、痕が物語る',
      version: 'v1.0',
    },
    common: {
      confirm: '確認',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      submit: '提出',
      loading: '読み込み中...',
      noData: 'データなし',
      success: '成功',
      error: 'エラー',
    },
    auth: {
      login: 'ログイン',
      logout: 'ログアウト',
      register: '登録',
      phone: '電話番号',
      code: 'コード',
      sendCode: 'コード送信',
    },
    content: {
      publish: '投稿',
      recall: '撤回',
      featured: '注目',
      pinned: 'ピン留め',
      comment: 'コメント',
      like: 'いいね',
      share: '共有',
    },
    follow: {
      follow: 'フォロー',
      following: 'フォロー中',
      mutual: '相互フォロー',
      followers: 'フォロワー',
    },
    settings: {
      title: '設定',
      profile: 'プロフィール',
      privacy: 'プライバシー',
      about: '概要',
    },
  },
  // 韩文
  ko: {
    app: {
      name: '유HEN 강호',
      slogan: '사람의 바다, 흔적이 이야기한다',
      version: 'v1.0',
    },
    common: {
      confirm: '확인',
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      edit: '편집',
      submit: '제출',
      loading: '로딩 중...',
      noData: '데이터 없음',
      success: '성공',
      error: '실패',
    },
    auth: {
      login: '로그인',
      logout: '로그아웃',
      register: '회원가입',
      phone: '전화번호',
      code: '코드',
      sendCode: '코드 발송',
    },
    content: {
      publish: '게시',
      recall: '철회',
      featured: '注目',
      pinned: '고정',
      comment: '댓글',
      like: '좋아요',
      share: '공유',
    },
    follow: {
      follow: '팔로우',
      following: '팔로잉',
      mutual: '맞팔로우',
      followers: '팔로워',
    },
    settings: {
      title: '설정',
      profile: '프로필',
      privacy: '개인정보',
      about: '정보',
    },
  },
};

/**
 * 获取翻译文本
 * @param key 翻译键，如 'common.confirm' 或 'app.name'
 * @param locale 语言代码，默认为 'zh'
 */
export function t(key: string, locale: string = defaultLocale): string {
  const lang = translations[locale] || translations[defaultLocale];
  const keys = key.split('.');
  
  let value: any = lang;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // 回退到中文
      value = translations[defaultLocale];
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // 返回原始键
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * 检测浏览器语言
 */
export function detectLocale(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return defaultLocale;
  
  const lang = acceptLanguage.toLowerCase();
  
  if (lang.includes('zh')) return 'zh';
  if (lang.includes('en')) return 'en';
  if (lang.includes('ja')) return 'ja';
  if (lang.includes('ko')) return 'ko';
  
  return defaultLocale;
}

export default {
  supportedLocales,
  defaultLocale,
  t,
  detectLocale,
};
