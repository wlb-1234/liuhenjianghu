import React from 'react';
import { Screen } from '@/components/Screen';
import { ScrollView, View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function AgreementScreen() {
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
          <Text style={styles.headerTitle}>用户协议</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>用户协议</Text>
            <Text style={styles.date}>更新日期：2024年1月1日</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>一、服务条款的确认和接受</Text>
            <Text style={styles.paragraph}>
              欢迎使用「流痕江湖」！
              {'\n\n'}
              本用户协议（以下简称&quot;本协议&quot;）是您与「流痕江湖」运营团队（以下简称&quot;我们&quot;）之间就使用本服务所订立的协议。
              请您在注册或使用本服务前仔细阅读本协议的全部内容。
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>重要提示：</Text>
              当您点击&quot;注册&quot;或开始使用本服务时，即表示您已充分阅读、理解并完全同意接受本协议的所有条款。
              如果您不同意本协议的任何内容，请立即停止注册或使用本服务。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>二、服务说明</Text>
            <Text style={styles.paragraph}>
              「流痕江湖」是一个公共交流平台，Slogan为&quot;人海为江湖，留言皆流痕&quot;。我们提供的服务包括：
            </Text>
            <Text style={styles.listItem}>• 公共信息发布与浏览</Text>
            <Text style={styles.listItem}>• 点赞、评论、互动功能</Text>
            <Text style={styles.listItem}>• 好友关注与私聊</Text>
            <Text style={styles.listItem}>• 会员订阅服务</Text>
            <Text style={styles.listItem}>• 基于IPFS的去中心化内容存储</Text>
            <Text style={styles.paragraph}>
              我们保留随时变更、中断或终止部分或全部服务的权利，并会提前通知用户。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>三、用户注册</Text>
            <Text style={styles.subTitle}>3.1 注册资格</Text>
            <Text style={styles.paragraph}>
              您确认：
              {'\n'}
              • 您是具有完全民事行为能力的自然人，或依法设立并有效存续的组织
              {'\n'}
              • 如您是未成年人，请在监护人的陪同下使用本服务
              {'\n'}
              • 一个手机号码只能注册一个账号
            </Text>
            <Text style={styles.subTitle}>3.2 注册信息</Text>
            <Text style={styles.paragraph}>
              您承诺：
              {'\n'}
              • 提供真实、准确、完整的个人信息
              {'\n'}
              • 及时更新您的注册信息
              {'\n'}
              • 妥善保管账号和密码，因保管不善造成的损失由您自行承担
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>四、用户行为规范</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.1 您承诺并保证不利用本服务从事以下行为：</Text>
            </Text>
            <Text style={styles.listItem}>• 违反宪法或法律法规规定的</Text>
            <Text style={styles.listItem}>• 危害国家安全、荣誉和利益的</Text>
            <Text style={styles.listItem}>• 煽动民族仇恨、民族歧视，破坏民族团结的</Text>
            <Text style={styles.listItem}>• 散布谣言，扰乱社会秩序，破坏社会稳定的</Text>
            <Text style={styles.listItem}>• 散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的</Text>
            <Text style={styles.listItem}>• 侮辱或者诽谤他人，侵害他人合法权益的</Text>
            <Text style={styles.listItem}>• 含有虚假、有害、胁迫、侵害他人隐私、骚扰、侵害、中伤、粗俗、猥亵、或其它道德上令人反感的内容</Text>
            <Text style={styles.listItem}>• 含有中国法律法规所禁止的内容</Text>
            <Text style={styles.listItem}>• 侵犯他人知识产权或其他合法权益的</Text>
            <Text style={styles.listItem}>• 其他我们认为不当的内容</Text>
          
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.2 内容发布规则</Text>
            </Text>
            <Text style={styles.listItem}>• 您发布的内容必须遵守法律法规和社会公德</Text>
            <Text style={styles.listItem}>• 您对发布内容的真实性、合法性负责</Text>
            <Text style={styles.listItem}>• 发布内容即表示您授权我们展示和分发</Text>
            <Text style={styles.listItem}>• 使用IPFS存储的内容具有永久性和不可删除性，请谨慎发布</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>五、会员服务</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.1 会员等级</Text>
            </Text>
            <Text style={styles.paragraph}>
              我们提供L0-L4五个会员等级，不同等级享有不同权益：
            </Text>
            <Text style={styles.listItem}>• L0 江湖散人：免费基础用户</Text>
            <Text style={styles.listItem}>• L1 镇帮帮众：¥9.9/月</Text>
            <Text style={styles.listItem}>• L2 县帮帮主：¥29.9/月</Text>
            <Text style={styles.listItem}>• L3 市盟盟主：¥99.9/月</Text>
            <Text style={styles.listItem}>• L4 省派掌门：¥299.9/月</Text>
          
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.2 支付</Text>
            </Text>
            <Text style={styles.paragraph}>
              • 会员费用按月计费，支付后即时生效
              {'\n'}
              • 支持微信支付、支付宝等支付方式
              {'\n'}
              • 会员资格不可转让
              {'\n'}
              • 虚拟商品一经购买不支持退款
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>六、知识产权</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>6.1 我们服务中的内容</Text>
            </Text>
            <Text style={styles.paragraph}>
              本服务及本服务包含的所有内容，包括但不限于文字、图形、徽标、按钮图标、图像、音频片段、
              数字下载、数据编辑和软件、我们的名称和标志等，均受知识产权法律法规保护。
              未经我们书面许可，您不得对上述内容进行修改、复制、分发等行为。
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>6.2 用户发布内容</Text>
            </Text>
            <Text style={styles.paragraph}>
              您在平台上发布的内容版权归您所有。但您发布内容即表示：
              {'\n'}
              • 授予我们全球范围内免费、非独占、可转授权的使用权
              {'\n'}
              • 授予其他用户浏览、评论您内容的权利
              {'\n'}
              • 内容使用IPFS存储后，具有永久性和不可删除性
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>七、违规处理</Text>
            <Text style={styles.paragraph}>
              如您违反本协议或相关法律法规，我们有权根据违规程度采取以下措施：
            </Text>
            <Text style={styles.listItem}>• 删除违规内容</Text>
            <Text style={styles.listItem}>• 警告并要求整改</Text>
            <Text style={styles.listItem}>• 限制部分功能使用</Text>
            <Text style={styles.listItem}>• 临时禁言</Text>
            <Text style={styles.listItem}>• 永久封禁账号</Text>
            <Text style={styles.paragraph}>
              违规处理决定由我们自行判断，不受用户约束。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>八、免责声明</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>8.1 内容免责</Text>
            </Text>
            <Text style={styles.paragraph}>
              用户发布的内容不代表我们的观点和立场，我们不对用户发布内容的真实性、合法性负责。
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>8.2 服务中断免责</Text>
            </Text>
            <Text style={styles.paragraph}>
              因以下情况造成服务中断，我们不承担责任：
              {'\n'}
              • 不可抗力因素（自然灾害、战争等）
              {'\n'}
              • 第三方服务商的过错
              {'\n'}
              • 定期或不定期的系统维护
              {'\n'}
              • 用户的过错
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>8.3 IPFS存储免责</Text>
            </Text>
            <Text style={styles.paragraph}>
              使用IPFS存储的内容具有去中心化特性，一旦发布将永久保存且不可删除。
              请您自行承担发布内容的责任，我们不对已发布内容负责。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>九、协议修改</Text>
            <Text style={styles.paragraph}>
              我们有权随时修改本协议的任何条款。修改后的协议一旦在App内公布即生效。
              如您不同意修改后的协议，有权停止使用本服务。
              如您继续使用本服务，则视为您完全接受修改后的协议。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>十、争议解决</Text>
            <Text style={styles.paragraph}>
              本协议的订立、执行和解释均适用中华人民共和国法律。
              如您与我们发生争议，双方应首先友好协商解决；协商不成的，任何一方均可向被告所在地人民法院提起诉讼。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>十一、联系我们</Text>
            <Text style={styles.paragraph}>
              如您对本协议有任何疑问，请通过以下方式联系我们：
            </Text>
            <Text style={styles.listItem}>• 客服电话：请通过应用内反馈</Text>
            <Text style={styles.listItem}>• 服务时间：工作日 9:00-18:00</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
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
  content: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
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
