import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, ShieldCheck, UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardFooter, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FamilyFields } from './forms';
import { useFamilyForm } from './formHooks';
import '../pages.css';

export function RegisterFamilyPage() {
  const navigate = useNavigate();
  const form = useFamilyForm({ onCreated: () => navigate('/families') });

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Shelter"
        eyebrowIcon={UserPlus}
        title="Register a family"
        description="Add an affected household to the relief registry so it can be prioritised and admitted to a shelter."
        actions={
          <Button variant="ghost" leftIcon={<ArrowLeft />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="form-page">
        <Card delay={0.05}>
          <form onSubmit={form.submit} noValidate>
            <CardHeader icon={UserPlus} title="Household details" subtitle="Fields marked * are required" />
            <CardBody>
              <FamilyFields form={form} />
            </CardBody>
            <CardFooter>
              <Button variant="ghost" onClick={form.reset} disabled={form.saving}>
                Reset
              </Button>
              <Button type="submit" variant="primary" loading={form.saving} leftIcon={<UserPlus />}>
                Register family
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="form-page__aside">
          <Card delay={0.1}>
            <CardHeader icon={Lightbulb} title="Good registration practice" />
            <CardBody>
              <ol className="tip-list">
                <li>
                  <span className="tip-list__num">01</span>
                  <span>Use a unique, readable family code — it is how teams refer to the household on the ground.</span>
                </li>
                <li>
                  <span className="tip-list__num">02</span>
                  <span>Record a phone number someone in the family can answer, even if it belongs to a neighbour.</span>
                </li>
                <li>
                  <span className="tip-list__num">03</span>
                  <span>Mark families with infants, elderly or injured members as High or Critical so they are admitted first.</span>
                </li>
              </ol>
            </CardBody>
          </Card>
          <div className="inline-alert">
            <ShieldCheck aria-hidden="true" />
            <span>Your account is recorded as the registering officer for accountability.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterFamilyPage;
