/**
 * 用户协议（服务条款）页面
 */
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';

export default function TermsScreen() {
  return (
    <Screen title="用户协议" showBackHeader>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>流痕江湖用户服务协议</Text>
          <Text style={styles.date}>最后更新：2024年1月1日</Text>

          <Text style={styles.section}>一、服务条款的确认和接受</Text>
          <Text style={styles.paragraph}>
            欢迎使用"流痕江湖"应用（以下简称"本应用"）。本用户服务协议（以下简称"本协议"）是您与本应用运营方之间关于使用本应用及相关服务所订立的协议。
          </Text>
          <Text style={styles.paragraph}>
            在您开始使用本应用之前，请您务必仔细阅读并理解本协议的全部内容。一旦您开始使用本应用，即表示您已充分理解并同意接受本协议的全部约束。
          </Text>

          <Text style={styles.section}>二、服务内容</Text>
          <Text style={styles.paragraph}>
            本应用的具体服务内容由运营方根据实际情况提供，包括但不限于：
          </Text>
          <Text style={styles.list}>• 江湖故事发布与阅读</Text>
          <Text style={styles.list}>• 用户互动交流</Text>
          <Text style={styles.list}>• 会员订阅服务</Text>
          <Text style={styles.list}>• 其他由运营方提供的服务</Text>

          <Text style={styles.section}>三、用户注册</Text>
          <Text style={styles.paragraph}>
            1. 您在注册成为本应用用户时，需要提供真实、准确、有效的个人资料。
          </Text>
          <Text style={styles.paragraph}>
            2. 您应妥善保管您的账户和密码，因保管不善造成的损失由您自行承担。
          </Text>
          <Text style={styles.paragraph}>
            3. 您不得以任何方式转让或授权他人使用您的账户。
          </Text>

          <Text style={styles.section}>四、内容规范</Text>
          <Text style={styles.paragraph}>
            您承诺在使用本应用服务时不得发布以下内容：
          </Text>
          <Text style={styles.list}>• 违反国家法律法规的内容</Text>
          <Text style={styles.list}>• 危害国家安全、恐怖主义的内容</Text>
          <Text style={styles.list}>• 侵犯他人合法权益的内容</Text>
          <Text style={styles.list}>• 含有暴力、色情、赌博等不良信息</Text>
          <Text style={styles.list}>• 其他违背社会公序良俗的内容</Text>

          <Text style={styles.section}>五、知识产权</Text>
          <Text style={styles.paragraph}>
            本应用的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、界面设计、版面框架等，均受知识产权法律法规保护。未经授权，您不得擅自复制、传播、修改或商业使用。
          </Text>

          <Text style={styles.section}>六、隐私保护</Text>
          <Text style={styles.paragraph}>
            我们重视您的隐私保护，详细内容请参阅《隐私政策》。您使用本应用即表示您同意我们按照隐私政策收集、使用和存储您的个人信息。
          </Text>

          <Text style={styles.section}>七、免责声明</Text>
          <Text style={styles.paragraph}>
            1. 本应用不对用户发布内容的真实性、准确性负责。
          </Text>
          <Text style={styles.paragraph}>
            2. 因不可抗力导致的服务中断，运营方不承担责任。
          </Text>
          <Text style={styles.paragraph}>
            3. 您因违反本协议导致的任何损失，由您自行承担。
          </Text>

          <Text style={styles.section}>八、会员服务与退款政策</Text>
          <Text style={styles.paragraph}>
            1. 会员服务包括普通会员和高级会员等级，购买后可享受相应的特权和服务。
          </Text>
          <Text style={styles.paragraph}>
            2. 会员服务为虚拟商品，一经购买成功，除以下情况外不支持退款：
          </Text>
          <Text style={styles.list}>• 购买或升级会员满24小时后，不支持退款</Text>
          <Text style={styles.list}>• 购买会员后已完成发送消息等核心功能使用的，不支持退款</Text>
          <Text style={styles.list}>• 因账号被封禁或违规导致的会员权益失效，不支持退款</Text>
          <Text style={styles.paragraph}>
            3. 如您在购买会员后24小时内且未使用核心功能（如发布内容、发送消息等），可申请退款。请联系客服处理。
          </Text>
          <Text style={styles.paragraph}>
            4. 会员到期后，相关特权将自动失效，已消耗的会员时长不予补发。
          </Text>

          <Text style={styles.section}>九、服务变更</Text>
          <Text style={styles.paragraph}>
            运营方保留随时修改或中断服务而不需通知您的权利。修改或中断服务后，您使用继续使用本应用即表示您接受变更后的条款。
          </Text>

          <Text style={styles.section}>十、协议修改</Text>
          <Text style={styles.paragraph}>
            运营方有权随时修改本协议的任何条款，修改后的协议一经公布即生效。如果您不同意修改后的协议，有权停止使用本服务。
          </Text>

          <Text style={styles.section}>十一、法律适用</Text>
          <Text style={styles.paragraph}>
            本协议的订立、执行和解释均适用中华人民共和国法律。因本协议引起的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院诉讼解决。
          </Text>

          <Text style={styles.section}>十二、未成年人保护</Text>
          <Text style={styles.paragraph}>
            1. 本应用非常重视对未成年人的保护。我们强烈建议家长或监护人积极参与并监督未成年人使用本应用。
          </Text>
          <Text style={styles.paragraph}>
            2. 如您为未满18周岁的未成年人，请在注册或使用本应用前，务必取得您的家长或监护人的同意。
          </Text>
          <Text style={styles.paragraph}>
            3. 未成年人用户在使用本应用时应遵守本协议及当地法律法规，注意保护个人信息安全。
          </Text>
          <Text style={styles.paragraph}>
            4. 如您是未成年人的家长或监护人，发现未成年人未经同意使用本应用，请联系我们予以处理。
          </Text>

          <Text style={styles.section}>十三、联系我们</Text>
          <Text style={styles.paragraph}>
            如您对本协议有任何疑问，请联系我们：liuhenjianghu@example.com
          </Text>
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
