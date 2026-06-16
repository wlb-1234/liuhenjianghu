import React from 'react';
import { Screen } from '@/components/Screen';
import { ScrollView, View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>隐私政策</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>隐私政策</Text>
            <Text style={styles.date}>更新日期：2024年1月1日</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>一、信息收集</Text>
            <Text style={styles.paragraph}>
              「流痕江湖」（以下简称&quot;我们&quot;）非常重视用户的隐私和个人信息保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。
            </Text>
            <Text style={styles.subTitle}>1.1 您主动提供的信息</Text>
            <Text style={styles.listItem}>• 注册账号时提供的手机号码</Text>
            <Text style={styles.listItem}>• 个人资料中的昵称、头像、区域信息</Text>
            <Text style={styles.listItem}>• 发布的内容（文字、图片）</Text>
            <Text style={styles.listItem}>• 评论、点赞、互动记录</Text>
            <Text style={styles.subTitle}>1.2 您在使用服务时自动采集的信息</Text>
            <Text style={styles.listItem}>• 设备信息（设备型号、操作系统版本）</Text>
            <Text style={styles.listItem}>• 日志信息（访问时间、浏览记录）</Text>
            <Text style={styles.listItem}>• 位置信息（所在区域，用于区域内容分发）</Text>
            <Text style={styles.listItem}>• IPFS上传记录（去中心化存储凭证）</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>二、信息使用</Text>
            <Text style={styles.paragraph}>我们收集的信息将用于以下目的：</Text>
            <Text style={styles.listItem}>• 提供、维护和改进我们的服务</Text>
            <Text style={styles.listItem}>• 识别您的身份，防止欺诈</Text>
            <Text style={styles.listItem}>• 向您推送个性化内容和广告</Text>
            <Text style={styles.listItem}>• 分析用户行为，优化产品体验</Text>
            <Text style={styles.listItem}>• 遵守法律法规要求</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>三、信息存储</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.1 去中心化存储</Text>
            </Text>
            <Text style={styles.paragraph}>
              您发布的内容（文字、图片）将使用IPFS去中心化存储技术进行永久保存。
              这意味着您的内容将分布存储在多个节点上，不依赖单一服务器，确保数据的持久性和抗审查性。
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.2 集中存储</Text>
            </Text>
            <Text style={styles.paragraph}>
              账户信息、操作日志等数据将存储在我们的服务器上，采用加密存储保护。
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.3 存储期限</Text>
            </Text>
            <Text style={styles.paragraph}>
              您的个人信息将在您注销账户后保留必要期限，用于法律法规要求或保护我们的合法权益。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>四、信息共享</Text>
            <Text style={styles.paragraph}>我们承诺不会出售您的个人信息。我们可能在以下情况下共享您的信息：</Text>
            <Text style={styles.listItem}>• 经您明确同意</Text>
            <Text style={styles.listItem}>• 根据法律法规要求或政府主管部门的要求</Text>
            <Text style={styles.listItem}>• 保护我们的合法权益，打击欺诈行为</Text>
            <Text style={styles.listItem}>• 为提供支付服务而与支付服务商共享必要信息</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>五、Cookie和同类技术</Text>
            <Text style={styles.paragraph}>
              我们使用Cookie和类似技术来记住您的偏好、保持登录状态、分析流量。您可以通过浏览器设置拒绝Cookie，但这可能影响部分功能使用。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>六、您的权利</Text>
            <Text style={styles.paragraph}>您对您的个人信息享有以下权利：</Text>
            <Text style={styles.listItem}>• 访问您的个人信息</Text>
            <Text style={styles.listItem}>• 更正不准确的信息</Text>
            <Text style={styles.listItem}>• 删除您的个人信息（注销账户）</Text>
            <Text style={styles.listItem}>• 撤回同意</Text>
            <Text style={styles.listItem}>• 数据导出（获取您的数据副本）</Text>
            <Text style={styles.paragraph}>
              如需行使上述权利，请联系客服：
              {'\n'}
              <Text 
                style={styles.link}
                onPress={() => Linking.openURL('tel:15613594588')}
              >
                请联系客服
              </Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>七、未成年人保护</Text>
            <Text style={styles.paragraph}>
              我们非常重视对未成年人信息的保护。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策，并在取得监护人的同意后使用我们的服务。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>八、隐私政策更新</Text>
            <Text style={styles.paragraph}>
              我们可能会不时更新本隐私政策。更新后的隐私政策将在App内显著位置提醒您。
              如您继续使用服务，视为您同意更新后的政策。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>九、联系我们</Text>
            <Text style={styles.paragraph}>
              如您对本隐私政策有任何疑问，请通过以下方式联系我们：
            </Text>
            <Text style={styles.listItem}>• 客服电话：请联系客服</Text>
            <Text style={styles.listItem}>• 服务时间：工作日 9:00-18:00</Text>
            <Text style={styles.listItem}>• 邮箱：support@liuhenjianghu.com（待配置）</Text>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.footerText}>
              「流痕江湖」运营团队{'\n'}
              人海为江湖，留言皆流痕
            </Text>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  date: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#D2691E',
  },
  placeholder: {
    width: 60,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#4A3728',
    lineHeight: 24,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B5344',
    marginTop: 12,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#4A3728',
    lineHeight: 24,
    paddingLeft: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  link: {
    color: '#D2691E',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
});
