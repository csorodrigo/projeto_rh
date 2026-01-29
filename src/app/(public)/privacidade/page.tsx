import { Metadata } from "next"
import { Shield, Lock, Eye, Database, FileText, AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de Privacidade | RH Sesame",
  description: "Política de Privacidade e Proteção de Dados do RH Sesame - LGPD",
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Intro */}
        <div className="bg-card rounded-lg p-6 border mb-8">
          <p className="leading-relaxed">
            O <strong>RH Sesame</strong> respeita sua privacidade e está
            comprometido em proteger seus dados pessoais. Esta Política de
            Privacidade descreve como coletamos, usamos, armazenamos e
            protegemos suas informações de acordo com a{" "}
            <strong>Lei Geral de Proteção de Dados (LGPD)</strong> - Lei nº
            13.709/2018.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* 1. Dados Coletados */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold">1. Dados Coletados</h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>Coletamos os seguintes tipos de dados:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Dados de Cadastro:</strong> nome completo, e-mail,
                  telefone, CPF, data de nascimento
                </li>
                <li>
                  <strong>Dados Trabalhistas:</strong> cargo, departamento,
                  salário, data de admissão, PIS, CTPS
                </li>
                <li>
                  <strong>Dados de Ponto:</strong> horários de entrada/saída,
                  localização (se habilitado)
                </li>
                <li>
                  <strong>Dados de Candidatos:</strong> currículo, carta de
                  apresentação, histórico profissional
                </li>
                <li>
                  <strong>Dados Técnicos:</strong> endereço IP, navegador,
                  dispositivo, cookies
                </li>
              </ul>
            </div>
          </section>

          {/* 2. Finalidade */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold">
                2. Finalidade do Tratamento
              </h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>Utilizamos seus dados para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestão de recursos humanos e folha de pagamento</li>
                <li>Controle de ponto e jornada de trabalho</li>
                <li>Processamento de férias e ausências</li>
                <li>Recrutamento e seleção de candidatos</li>
                <li>Comunicação com funcionários e candidatos</li>
                <li>Cumprimento de obrigações legais e trabalhistas</li>
                <li>Melhoria dos nossos serviços e experiência do usuário</li>
              </ul>
            </div>
          </section>

          {/* 3. Base Legal */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold">3. Base Legal</h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>
                O tratamento de dados pessoais é fundamentado nas seguintes
                bases legais:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Execução de contrato:</strong> dados necessários para
                  a relação de trabalho
                </li>
                <li>
                  <strong>Obrigação legal:</strong> cumprimento de obrigações
                  trabalhistas e fiscais
                </li>
                <li>
                  <strong>Consentimento:</strong> para funcionalidades opcionais
                  como geolocalização
                </li>
                <li>
                  <strong>Interesse legítimo:</strong> melhoria dos serviços e
                  segurança
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Compartilhamento */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-semibold">
                4. Compartilhamento de Dados
              </h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Órgãos Públicos:</strong> quando exigido por lei
                  (e-Social, Receita Federal, etc.)
                </li>
                <li>
                  <strong>Prestadores de Serviço:</strong> contadores,
                  advogados, planos de saúde
                </li>
                <li>
                  <strong>Fornecedores de Tecnologia:</strong> hospedagem,
                  armazenamento, processamento
                </li>
              </ul>
              <p className="mt-3">
                <strong>Importante:</strong> Nunca vendemos seus dados pessoais
                a terceiros.
              </p>
            </div>
          </section>

          {/* 5. Segurança */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold">5. Segurança</h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>
                Implementamos medidas técnicas e organizacionais para proteger
                seus dados:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Criptografia de dados sensíveis em repouso</li>
                <li>Controle de acesso baseado em funções (RBAC)</li>
                <li>Autenticação multifator (quando disponível)</li>
                <li>Backups regulares e plano de recuperação de desastres</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Auditorias periódicas de segurança</li>
              </ul>
            </div>
          </section>

          {/* 6. Retenção */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold">6. Retenção de Dados</h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>Mantemos seus dados pelo tempo necessário para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Dados trabalhistas:</strong> pelo prazo legal (5 anos
                  após término do contrato)
                </li>
                <li>
                  <strong>Dados de candidatos:</strong> 2 anos após última
                  interação
                </li>
                <li>
                  <strong>Logs de acesso:</strong> 6 meses (requisito legal)
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Direitos do Titular */}
          <section className="bg-blue-500/5 rounded-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold mb-4">
              7. Seus Direitos (LGPD)
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>De acordo com a LGPD, você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Confirmação:</strong> saber se tratamos seus dados
                </li>
                <li>
                  <strong>Acesso:</strong> obter cópia dos seus dados
                </li>
                <li>
                  <strong>Correção:</strong> corrigir dados incompletos ou
                  incorretos
                </li>
                <li>
                  <strong>Anonimização/Bloqueio:</strong> solicitar
                  anonimização ou bloqueio
                </li>
                <li>
                  <strong>Eliminação:</strong> excluir dados desnecessários
                </li>
                <li>
                  <strong>Portabilidade:</strong> transferir dados para outro
                  fornecedor
                </li>
                <li>
                  <strong>Revogação:</strong> retirar consentimento a qualquer
                  momento
                </li>
                <li>
                  <strong>Oposição:</strong> opor-se a tratamentos específicos
                </li>
              </ul>
              <p className="mt-4">
                Para exercer seus direitos, entre em contato com nosso DPO
                (Encarregado de Dados).
              </p>
            </div>
          </section>

          {/* 8. Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Database className="h-5 w-5 text-pink-600" />
              </div>
              <h2 className="text-2xl font-semibold">8. Cookies</h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>Utilizamos cookies para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Essenciais:</strong> funcionamento básico do sistema
                </li>
                <li>
                  <strong>Funcionais:</strong> lembrar preferências do usuário
                </li>
                <li>
                  <strong>Analíticos:</strong> entender como o site é utilizado
                </li>
              </ul>
              <p className="mt-3">
                Você pode gerenciar cookies nas configurações do seu navegador.
              </p>
            </div>
          </section>

          {/* 9. Contato DPO */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-semibold mb-4">
              9. Encarregado de Dados (DPO)
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Para dúvidas sobre esta política ou exercer seus direitos,
                contate nosso DPO:
              </p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong>E-mail:</strong> dpo@rhsesame.com.br
                </p>
                <p>
                  <strong>Telefone:</strong> (11) 3000-0000
                </p>
                <p>
                  <strong>Endereço:</strong> [Endereço da empresa]
                </p>
              </div>
              <p className="mt-4">
                <strong>Autoridade Nacional:</strong> Você também pode entrar
                em contato com a ANPD (Autoridade Nacional de Proteção de
                Dados) em{" "}
                <a
                  href="https://www.gov.br/anpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  www.gov.br/anpd
                </a>
              </p>
            </div>
          </section>

          {/* 10. Alterações */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-teal-600" />
              </div>
              <h2 className="text-2xl font-semibold">
                10. Alterações na Política
              </h2>
            </div>
            <div className="pl-11 space-y-3 text-muted-foreground">
              <p>
                Esta Política de Privacidade pode ser atualizada periodicamente.
                Notificaremos sobre alterações significativas por e-mail ou
                aviso no sistema.
              </p>
              <p>
                Recomendamos que você revise esta página regularmente para se
                manter informado.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-8">
          <p>
            Esta política está em conformidade com a Lei Geral de Proteção de
            Dados (LGPD) - Lei nº 13.709/2018.
          </p>
          <p className="mt-2">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  )
}
