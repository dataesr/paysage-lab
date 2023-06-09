import {
  Badge, BadgeGroup, Breadcrumb, BreadcrumbItem,
  ButtonGroup, Col, Container, Icon, Modal, ModalContent,
  ModalTitle, Row, SideMenu, SideMenuLink, Title,
} from '@dataesr/react-dsfr';
import { useCallback, useEffect, useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import Button from '../../../components/button';
import CopyBadgeButton from '../../../components/copy/copy-badge-button';
import { DropdownButton, DropdownButtonItem } from '../../../components/dropdown-button';
import Error from '../../../components/errors';
import StructureDeleteForm from '../../../components/forms/delete';
import StructureDescriptionForm from '../../../components/forms/structures/descriptions';
import StructureHistoryForm from '../../../components/forms/structures/historique';
import StructureMottoForm from '../../../components/forms/structures/motto';
import StructureStatusForm from '../../../components/forms/structures/status';
import { PageSpinner } from '../../../components/spinner';
import useAuth from '../../../hooks/useAuth';
import useEditMode from '../../../hooks/useEditMode';
import useFetch from '../../../hooks/useFetch';
import useNotice from '../../../hooks/useNotice';
import usePageTitle from '../../../hooks/usePageTitle';
import useShortcuts from '../../../hooks/useShortcuts';
import useUrl from '../../../hooks/useUrl';
import api from '../../../utils/api';
import { getComparableNow } from '../../../utils/dates';
import { saveError, saveSuccess } from '../../../utils/notice-contents';
import { getName } from '../../../utils/structures';
import StructurePresentationPage from './presentation';

function StructureByIdPage() {
  const { viewer } = useAuth();
  const { notice } = useNotice();
  const { id } = useParams();
  const { url } = useUrl();
  const { data, isLoading, error, reload } = useFetch(url);
  const navigate = useNavigate();
  const { editMode, reset, toggle } = useEditMode();
  // const [isFavorite, setIsFavorite] = useState(false);

  function badgeColor() {
    if (data.structureStatus === 'active' || data.closureDate > getComparableNow()) {
      return <Badge colorFamily="green-emeraude" text={data.structureStatus} />;
    } if (data.structureStatus === 'inactive' || data.closureDate < getComparableNow()) {
      return <Badge text="inactive" type="warning" />;
    } if (data.structureStatus === 'forthcoming' || data.creationDate > getComparableNow()) {
      return <Badge text="A venir" type="info" />;
    }
    return null;
  }

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isMottoModalOpen, setIsMottoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => { reset(); }, [reset]);
  usePageTitle(`Structures · ${data?.currentName.usualName}`);
  useShortcuts(['Control', 'e'], useCallback(() => toggle(), [toggle]));

  const onSaveHandler = async (body) => {
    await api.patch(url, body)
      .then(() => {
        notice(saveSuccess);
        reload();
      })
      .catch(() => notice(saveError));
    setIsStatusModalOpen(false);
    setIsDescriptionModalOpen(false);
    setIsMottoModalOpen(false);
    setIsHistoryModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const onDeleteHandler = async (redirectionId) => {
    const redirectionUrl = redirectionId ? `/structures/${redirectionId}` : '/';
    const deleteStructure = async () => api.delete(url)
      .then(() => {
        notice(saveSuccess);
        navigate(redirectionUrl);
        setIsDeleteModalOpen(false);
      })
      .catch(() => notice(saveError));
    if (redirectionId) {
      return api.put(`/structures/${redirectionId}/alternative-ids/${id}`)
        .then(async () => deleteStructure())
        .catch(() => notice(saveError));
    }
    return deleteStructure();
  };

  if (isLoading) return <PageSpinner />;
  if (error || !data) return <Error status={error} />;
  return (
    <Container spacing="pb-6w">
      <Row>
        <Col n="12 md-3">
          <SideMenu buttonLabel="Navigation">
            <SideMenuLink asLink={<RouterLink to="presentation#" replace />}>
              <Icon name="ri-eye-2-line" size="1x" />
              En un coup d’œil
            </SideMenuLink>
            <SideMenuLink asLink={<RouterLink to="actualites" replace />}>
              <Icon name="ri-newspaper-line" size="1x" />
              Actualités
            </SideMenuLink>
            <SideMenuLink asLink={<RouterLink to="evenements" replace />}>
              <Icon name="ri-calendar-line" size="1x" />
              Evènements
            </SideMenuLink>
            <SideMenuLink asLink={<RouterLink to="documents" replace />}>
              <Icon name="ri-folders-line" size="1x" />
              Ressources
            </SideMenuLink>
            <SideMenuLink asLink={<RouterLink to="textes-officiels" replace />}>
              <Icon name="ri-git-repository-line" size="1x" />
              Textes officiels
            </SideMenuLink>
            {(viewer.role === 'admin') && (
              <SideMenuLink asLink={<RouterLink to="journal" replace />}>
                <Icon name="ri-refresh-line" size="1x" />
                Journal de modifications
              </SideMenuLink>
            )}
          </SideMenu>
        </Col>
        <Col n="12 md-9">
          <Row className="flex--space-between flex--wrap stick">
            <Breadcrumb>
              <BreadcrumbItem asLink={<RouterLink to="/" />}>
                Accueil
              </BreadcrumbItem>
              <BreadcrumbItem
                asLink={<RouterLink to="/rechercher/structures?query=&page=1" />}
              >
                Structures
              </BreadcrumbItem>
              <BreadcrumbItem>
                {getName(data?.currentName)}
              </BreadcrumbItem>
            </Breadcrumb>

            <ButtonGroup align="right" isInlineFrom="xs" className="fr-mt-1w flex--grow">
              {editMode && (
                <DropdownButton align="right" title="options">
                  <DropdownButtonItem onClick={() => setIsStatusModalOpen(true)}>
                    Modifier le statut
                    <Icon iconPosition="right" size="xl" name="ri-edit-line" color="var(--border-action-high-blue-france)" />
                  </DropdownButtonItem>
                  <DropdownButtonItem onClick={() => setIsDescriptionModalOpen(true)}>
                    Ajouter/Modifier la description
                    <Icon iconPosition="right" size="xl" name="ri-edit-line" color="var(--border-action-high-blue-france)" />
                  </DropdownButtonItem>
                  <DropdownButtonItem onClick={() => setIsMottoModalOpen(true)}>
                    Ajouter/Modifier la devise
                    <Icon iconPosition="right" size="xl" name="ri-edit-line" color="var(--border-action-high-blue-france)" />
                  </DropdownButtonItem>
                  <DropdownButtonItem onClick={() => setIsHistoryModalOpen(true)}>
                    Ajouter/Modifier l'historique
                    <Icon iconPosition="right" size="xl" name="ri-edit-line" color="var(--border-action-high-blue-france)" />
                  </DropdownButtonItem>
                  {(viewer.role === 'admin') && (
                    <DropdownButtonItem onClick={() => setIsDeleteModalOpen(true)}>
                      Supprimer la structure
                      <Icon iconPosition="right" size="xl" name="ri-delete-bin-line" color="var(--background-action-high-error)" />
                      <Modal isOpen={isDeleteModalOpen} hide={() => setIsDeleteModalOpen(false)}>
                        <ModalTitle>
                          Supprimer la structure
                        </ModalTitle>
                        <ModalContent>
                          <StructureDeleteForm onDelete={onDeleteHandler} type="structures" currentObjectId={id} />
                        </ModalContent>
                      </Modal>
                    </DropdownButtonItem>
                  )}
                </DropdownButton>
              )}
              {(viewer.role !== 'reader') && (
                <Button
                  tertiary
                  borderless
                  rounded
                  title="Activer le mode édition"
                  onClick={() => toggle()}
                  icon={`ri-edit-${editMode ? 'fill' : 'line'}`}
                />
              )}
            </ButtonGroup>
          </Row>
          <Row>
            <Title as="h2">
              {getName(data?.currentName)}
              <BadgeGroup className="fr-pt-1w">
                <Badge type="info" text="structure" />
                {badgeColor()}
                <CopyBadgeButton colorFamily="yellow-tournesol" text={data.id} lowercase />
              </BadgeGroup>
            </Title>
            <Modal size="lg" isOpen={isHistoryModalOpen} hide={() => setIsHistoryModalOpen(false)}>
              <ModalTitle>
                Modification de l'historique
              </ModalTitle>
              <ModalContent>
                <StructureHistoryForm data={data} onSave={onSaveHandler} />
              </ModalContent>
            </Modal>

            <Modal size="md" isOpen={isStatusModalOpen} hide={() => setIsStatusModalOpen(false)}>
              <ModalTitle>
                Modification du statut
              </ModalTitle>
              <ModalContent>
                <StructureStatusForm data={data} onSave={onSaveHandler} />
              </ModalContent>
            </Modal>

            <Modal size="md" isOpen={isMottoModalOpen} hide={() => setIsMottoModalOpen(false)}>
              <ModalTitle>
                Modification de la devise
              </ModalTitle>
              <ModalContent>
                <StructureMottoForm data={data} onSave={onSaveHandler} />
              </ModalContent>
            </Modal>

            <Modal size="md" isOpen={isDescriptionModalOpen} hide={() => setIsDescriptionModalOpen(false)}>
              <ModalTitle>
                Modification de la description
              </ModalTitle>
              <ModalContent>
                <StructureDescriptionForm data={data} onSave={onSaveHandler} />
              </ModalContent>
            </Modal>
          </Row>
          <Outlet context={data} />
        </Col>
      </Row>
    </Container>
  );
}

export {
  StructureByIdPage,
  StructurePresentationPage,
};
