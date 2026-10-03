import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardPlus, Clock3, ShieldCheck, Workflow } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardFooter, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RequestFields } from './forms';
import { useRequestForm } from './formHooks';
import { useFetch } from '../../hooks/useFetch';
import { sheltersService } from '../../services/api';
import '../pages.css';

export function CreateRequestPage() {
  const navigate = useNavigate();

  // Ask the backend for the shelter(s) explicitly assigned to this manager.
  // This works even when a shelter has no inventory rows yet.
  const { data: myShelters } = useFetch(() => sheltersService.mine());
  const shelterOptions = myShelters || [];

  const form = useRequestForm({
    onCreated: () => navigate('/requests'),
    defaultShelterId: shelterOptions.length === 1 ? shelterOptions[0].shelter_id : undefined,
  });

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Shelter"
        eyebrowIcon={ClipboardPlus}
        title="New relief request"
        description="Tell the relief team what your shelter needs. Approved requests are fulfilled through distributions."
        actions={
          <Button variant="ghost" leftIcon={<ArrowLeft />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="form-page">
        <Card delay={0.05}>
          <form onSubmit={form.submit} noValidate>
            <CardHeader icon={ClipboardPlus} title="Request details" subtitle="Add every item you need — quantities can be partially fulfilled" />
            <CardBody>
              <RequestFields form={form} shelterOptions={shelterOptions} />
            </CardBody>
            <CardFooter>
              <Button variant="ghost" onClick={form.reset} disabled={form.saving}>
                Reset
              </Button>
              <Button type="submit" variant="primary" loading={form.saving} leftIcon={<ClipboardPlus />}>
                Submit request
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="form-page__aside">
          <Card delay={0.1}>
            <CardHeader icon={Workflow} title="What happens next" />
            <CardBody>
              <ol className="tip-list">
                <li>
                  <span className="tip-list__num">01</span>
                  <span>Your request enters the relief managers' approval queue with status Requested.</span>
                </li>
                <li>
                  <span className="tip-list__num">02</span>
                  <span>Once approved, supplies are dispatched in one or more distributions.</span>
                </li>
                <li>
                  <span className="tip-list__num">03</span>
                  <span>Each delivery updates fulfilled quantities until the request is marked Delivered.</span>
                </li>
              </ol>
            </CardBody>
          </Card>
          <div className="inline-alert">
            <Clock3 aria-hidden="true" />
            <span>Critical requests are surfaced first to relief managers and in every manager's alerts.</span>
          </div>
          <div className="inline-alert">
            <ShieldCheck aria-hidden="true" />
            <span>Shelter managers can request supplies only for the shelters assigned to them.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateRequestPage;
