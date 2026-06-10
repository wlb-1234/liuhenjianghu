/**
 * 隐私政策页面
 */
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';

export default function PrivacyScreen() {
  return (
    <Screen title="隐私政策" showBackHeader>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>流痕江湖隐私政策</Text>
          <Text style={styles.date}>最后更新：2024年1月1日</Text>

          <Text style={styles.section}>引言</Text>
          <Text style={styles.paragraph}>
            流痕江湖（以下简称"我们"）非常重视您的个人信息保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。
          </Text>
          <Text style={styles.paragraph}>
            请您在使用我们的服务前，仔细阅读并了解本隐私政策。如您不同意本政策的任何内容，您应立即停止使用本应用。
          </Text>

          <Text style={styles.section}>一、信息收集</Text>
          <Text style={styles.subSection}>1. 您主动提供的信息</Text>
          <Text style={styles.paragraph}>
            当您注册账户时，您可能会向我们提供手机号码、昵称、头像等个人信息。
          </Text>
          <Text style={styles.paragraph}>
            当您发布内容时，我们可能会收集您主动提供的内容信息，包括文字、图片等。
          </Text>

          <Text style={styles.subSection}>2. 服务使用过程中自动收集的信息</Text>
          <Text style={styles.paragraph}>
            • 设备信息：包括设备型号、操作系统版本、设备标识符等
          </Text>
          <Text style={styles.paragraph}>
            • 日志信息：您使用服务时的操作记录、访问时间、页面浏览记录等
          </Text>
          <Text style={styles.paragraph}>
            • 位置信息：经过您授权后获取的地理位置信息
          </Text>

          <Text style={styles.subSection}>3. 第三方来源信息</Text>
          <Text style={styles.paragraph}>
            在法律允许的情况下，我们可能会从第三方服务提供商处获取关于您的信息。
          </Text>

          <Text style={styles.section}>二、信息使用</Text>
          <Text style={styles.paragraph}>我们使用您的信息用于以下目的：</Text>
          <Text style={styles.list}>• 提供、维护和改进我们的服务</Text>
          <Text style={styles.list}>• 账户注册、安全验证和客户服务</Text>
          <Text style={styles.list}>• 发送服务相关的通知和更新</Text>
          <Text style={styles.list}>• 分析服务使用情况，优化用户体验</Text>
          <Text style={styles.list}>• 预防、检测欺诈和滥用行为</Text>
          <Text style={styles.list}>• 遵守法律法规的要求</Text>

          <Text style={styles.section}>三、信息共享</Text>
          <Text style={styles.paragraph}>
            除以下情况外，我们不会与任何第三方共享您的个人信息：
          </Text>
          <Text style={styles.list}>• 获得您的明确同意</Text>
          <Text style={styles.list}>• 根据法律法规要求或政府主管部门要求</Text>
          <Text style={styles.list}>• 为保护我们的合法权益而必需</Text>
          <Text style={styles.list}>• 与我们的关联公司共享（限于提供服务所需）</Text>
          <Text style={styles.list}>• 与授权合作伙伴共享（仅用于提供服务）</Text>

          <Text style={styles.section}>四、信息存储</Text>
          <Text style={styles.paragraph}>
            我们会按照适用法律法规的要求，在合理必要期限内保存您的个人信息。超过保存期限后，我们会对您的信息进行删除或匿名化处理。
          </Text>

          <Text style={styles.section}>五、信息安全</Text>
          <Text style={styles.paragraph}>
            我们采取了合理的安全措施来保护您的个人信息，包括：
          </Text>
          <Text style={styles.list}>• 数据传输加密（HTTPS/SSL）</Text>
          <Text style={styles.list}>• 数据存储加密</Text>
          <Text style={styles.list}>• 访问权限控制</Text>
          <Text style={styles.list}>• 定期安全审计</Text>

          <Text style={styles.section}>六、您的权利</Text>
          <Text style={styles.paragraph}>您对您的个人信息享有以下权利：</Text>
          <Text style={styles.list}>• 访问权：了解我们持有您的哪些个人信息</Text>
          <Text style={styles.list}>• 更正权：要求更正不准确的个人信息</Text>
          <Text style={styles.list}>• 删除权：在符合条件时要求删除您的个人信息</Text>
          <Text style={styles.list}>• 注销账户：申请注销您的账户</Text>
          <Text style={styles.list}>• 撤回同意：撤回您之前同意的内容</Text>

          <Text style={styles.section}>七、未成年人保护</Text>
          <Text style={styles.paragraph}>
            我们非常重视对未成年人信息的保护。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策，并在取得监护人的同意后使用我们的服务。
          </Text>
          <Text style={styles.paragraph}>
            我们不会故意收集未成年人的个人信息。如您是未成年人，请勿向我们提供任何个人信息。
          </Text>

          <Text style={styles.section}>八、隐私政策更新</Text>
          <Text style={styles.paragraph}>
            我们可能会不时更新本隐私政策。更新后的政策将在本应用内公布。如果更新涉及重大变更，我们将通过适当方式通知您。
          </Text>

          <Text style={styles.section}>九、联系我们</Text>
          <Text style={styles.paragraph}>
            如您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：
          </Text>
          <Text style={styles.paragraph}>邮箱：liuhenjianghu@example.com</Text>
          <Text style={styles.paragraph}>我们将在收到您的请求后尽快处理。</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subSection: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  list: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginLeft: 10,
  },
});
